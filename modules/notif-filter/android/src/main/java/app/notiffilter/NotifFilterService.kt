package app.notiffilter

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

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

    override fun onCreate() {
        super.onCreate()
        ruleStore = RuleStore(this)
        ruleStore.onChange = { Log.i(TAG, "Rules/settings reloaded (${ruleStore.compiledRules.size} compiled rules)") }
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

        when (result.decision) {
            Decision.BLOCK -> {
                cancelNotification(sbn.key)
                Log.i(TAG, "BLOCKED — app=${sbn.packageName} " +
                        "title=${content.title} " +
                        "ruleId=${result.ruleId ?: "default-policy"} " +
                        "match=${result.matchedSegment ?: "-"}")
                // TODO M4: insert into blocked log (SQLite)
            }
            Decision.ALLOW -> {
                Log.i(TAG, "ALLOW — app=${sbn.packageName} " +
                        "title=${content.title} " +
                        "ruleId=${result.ruleId ?: "default"} " +
                        "ongoing=$isOngoing")
                // TODO M4: insert into history log
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }
}
