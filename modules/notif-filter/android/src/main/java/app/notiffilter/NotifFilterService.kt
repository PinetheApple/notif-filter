package app.notiffilter

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.util.UUID

class NotifFilterService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifFilter"
        var isConnected: Boolean = false
            private set
        var moduleRef: NotifFilterModule? = null

        /** Packages that have posted at least one notification since service start. */
        val seenPackages: MutableSet<String> = mutableSetOf()
    }

    private lateinit var ruleStore: RuleStore
    private lateinit var historyStore: HistoryStore

    override fun onCreate() {
        super.onCreate()
        ruleStore = RuleStore(this)
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
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        isConnected = false
        Log.i(TAG, "Listener disconnected")
        moduleRef?.sendEvent("onListenerConnectionChanged", mapOf("connected" to false))
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val notification = sbn.notification
        val extras = notification.extras
        val isOngoing = notification.flags and Notification.FLAG_ONGOING_EVENT != 0

        seenPackages.add(sbn.packageName)

        val content = NotificationContent.fromExtras(sbn.packageName, extras, isOngoing)

        val settings = ruleStore.settings
        val result = RuleEngine.evaluate(
            notification = content,
            compiledRules = ruleStore.compiledRules,
            defaultPolicy = settings.defaultPolicy,
            filterOngoing = settings.filterOngoing
        )

        val now = System.currentTimeMillis()
        val appLabel = resolveAppLabel(sbn.packageName)
        val ruleLabel = result.ruleId?.let { rid ->
            ruleStore.compiledRules.find { it.rule.id == rid }?.rule?.label
        }

        val entry = HistoryEntry(
            id = UUID.randomUUID().toString(),
            packageName = sbn.packageName,
            appLabel = appLabel,
            title = content.title,
            text = content.text,
            disposition = if (result.decision == Decision.BLOCK) "blocked" else "shown",
            ruleId = result.ruleId,
            ruleLabel = ruleLabel,
            matchedSegment = result.matchedSegment,
            timestamp = now,
            postTime = sbn.postTime
        )

        when (result.decision) {
            Decision.BLOCK -> {
                cancelNotification(sbn.key)
                Log.i(TAG, "BLOCKED — app=$appLabel title=${content.title}")
            }
            Decision.ALLOW -> {
                Log.i(TAG, "ALLOW — app=$appLabel title=${content.title}")
            }
        }

        historyStore.insert(entry)
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
