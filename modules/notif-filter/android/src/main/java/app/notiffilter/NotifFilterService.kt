package app.notiffilter

import android.app.Notification
import android.content.ComponentName
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException

class NotifFilterService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifFilter"
        var isConnected: Boolean = false
            private set
        var moduleRef: NotifFilterModule? = null

        /**
         * Packages that have posted at least one notification since service start.
         *
         * Concurrent because the reconnect backfill writes it from a background thread
         * while the JS bridge reads it.
         */
        val seenPackages: MutableSet<String> =
            Collections.newSetFromMap(ConcurrentHashMap<String, Boolean>())

        fun isEnabled(context: Context): Boolean =
            NotificationManagerCompat.getEnabledListenerPackages(context)
                .contains(context.packageName)
    }

    private lateinit var ruleStore: RuleStore
    private lateinit var historyStore: HistoryStore
    private lateinit var backfillExecutor: ExecutorService

    /** Set in onDestroy so an in-flight backfill stops touching a torn-down service. */
    @Volatile
    private var isTornDown = false

    override fun onCreate() {
        super.onCreate()
        backfillExecutor = Executors.newSingleThreadExecutor()
        ruleStore = RuleStore.get(this)
        ruleStore.onChange = {
            Log.i(TAG, "Rules/settings reloaded (${ruleStore.compiledRules.size} compiled rules)")
        }
        historyStore = HistoryStore(this)
        Log.i(TAG, "Service created, ${ruleStore.compiledRules.size} rules loaded")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        isConnected = true
        Log.i(TAG, "Listener connected")
        moduleRef?.sendEvent("onListenerConnectionChanged", mapOf("connected" to true))
        scheduleBackfill()
    }

    /**
     * Queue the reconnect backfill onto the background thread.
     *
     * onListenerConnected runs on the main thread and a full shade costs one
     * PackageManager IPC and several SQLite statements per notification, which is an ANR
     * on any reconnect that follows a boot, an update or a force-stop.
     */
    private fun scheduleBackfill() {
        try {
            backfillExecutor.execute(::recoverActiveNotifications)
        } catch (e: RejectedExecutionException) {
            Log.w(TAG, "Reconnect backfill skipped, service is shutting down", e)
        }
    }

    /**
     * Process notifications that arrived while the listener was unbound.
     *
     * `onNotificationPosted` only fires while bound, so anything posted during a Doze
     * window or after a process kill reached nobody: no rule ran and no history row was
     * written. The still-visible ones are recoverable from [getActiveNotifications].
     *
     * Runs on [backfillExecutor]; the listener binder calls it uses are safe off the
     * main thread.
     */
    private fun recoverActiveNotifications() {
        if (shouldStopBackfill()) return

        val active = try {
            activeNotifications
        } catch (e: Exception) {
            Log.e(TAG, "Could not read active notifications on reconnect", e)
            return
        } ?: return

        var recoveredCount = 0
        for (sbn in active) {
            if (shouldStopBackfill()) {
                Log.i(TAG, "Reconnect backfill stopped after $recoveredCount, listener is gone")
                return
            }
            try {
                if (processNotification(sbn, recovered = true)) recoveredCount++
            } catch (e: Exception) {
                Log.e(TAG, "Failed to recover notification from ${sbn.packageName}", e)
            }
        }
        Log.i(TAG, "Reconnect backfill: $recoveredCount of ${active.size} notifications recovered")
    }

    private fun shouldStopBackfill(): Boolean =
        isTornDown || Thread.currentThread().isInterrupted || !isConnected

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        isConnected = false
        Log.i(TAG, "Listener disconnected")
        moduleRef?.sendEvent("onListenerConnectionChanged", mapOf("connected" to false))

        // Android drops the binding after a force-stop or app update. Ask for it back so
        // filtering resumes without the user re-granting access, but only while access
        // is still held — otherwise this loops against a revoked permission.
        if (isEnabled(this)) {
            requestRebind(ComponentName(this, NotifFilterService::class.java))
        }
    }

    override fun onDestroy() {
        isTornDown = true
        backfillExecutor.shutdownNow()
        // The store outlives the service now, so a retained listener pins a dead service.
        ruleStore.onChange = null
        super.onDestroy()
    }

    // A throw out of this callback kills the service and with it all filtering, so it is
    // a hard error boundary: log and drop the one notification rather than dying.
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        try {
            processNotification(sbn, recovered = false)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle notification from ${sbn.packageName}", e)
        }
    }

    /**
     * Evaluate [sbn], cancel it when evaluation blocks it, and record it in history.
     *
     * @param recovered marks a backfilled notification the user has already seen.
     * @return true when a history row was written.
     */
    private fun processNotification(sbn: StatusBarNotification, recovered: Boolean): Boolean {
        val notification = sbn.notification
        val extras = notification.extras
        val isOngoing = notification.flags and Notification.FLAG_ONGOING_EVENT != 0
        val isGroupSummary = notification.flags and Notification.FLAG_GROUP_SUMMARY != 0

        // Recorded before the exemption check so ignored apps stay listed in the picker
        // and the user can take them off the ignored list again.
        seenPackages.add(sbn.packageName)

        val content = NotificationContent.fromExtras(sbn.packageName, extras, isOngoing)

        val settings = ruleStore.settings
        if (RuleEngine.isExempt(content, settings)) return false
        // Rows are keyed by notification, so backfilling a recorded notification
        // would re-evaluate it and overwrite its row. Skip those.
        val id = HistoryEntry.deriveId(sbn.key ?: "", sbn.postTime)
        if (recovered && historyStore.exists(id)) return false

        val result = RuleEngine.evaluate(
            notification = content,
            compiledRules = ruleStore.compiledRules,
            defaultPolicy = settings.defaultPolicy
        )

        val now = System.currentTimeMillis()
        val appLabel = resolveAppLabel(sbn.packageName)
        val ruleLabel = result.ruleId?.let { rid ->
            ruleStore.compiledRules.find { it.rule.id == rid }?.rule?.label
        }

        val entry = HistoryEntry(
            id = id,
            packageName = sbn.packageName,
            appLabel = appLabel,
            title = content.title,
            text = content.text,
            subText = content.subText,
            bigText = content.bigText,
            summaryText = content.summaryText,
            infoText = content.infoText,
            textLines = content.textLines,
            disposition = if (result.decision == Decision.BLOCK) "blocked" else "shown",
            ruleId = result.ruleId,
            ruleLabel = ruleLabel,
            matchedSegment = result.matchedSegment,
            notifKey = sbn.key ?: "",
            recovered = recovered,
            timestamp = now,
            postTime = sbn.postTime
        )

        val origin = if (recovered) "RECOVERED " else ""
        when (result.decision) {
            Decision.BLOCK -> {
                cancelNotification(sbn.key)
                Log.i(TAG, "${origin}BLOCKED — app=$appLabel title=${content.title}")
            }
            Decision.ALLOW -> {
                Log.i(TAG, "${origin}ALLOW — app=$appLabel title=${content.title}")
            }
        }

        // Group summaries repeat their children's content, so recording them renders
        // the same message twice. Rules still evaluate and cancel the summary itself;
        // only the history row is skipped.
        if (!isGroupSummary) {
            historyStore.insert(entry, settings.logSize)
        }
        return !isGroupSummary
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }

    private fun resolveAppLabel(packageName: String): String {
        return try {
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(packageName, 0)
            ).toString()
        } catch (_: Exception) {
            packageName
        }
    }
}
