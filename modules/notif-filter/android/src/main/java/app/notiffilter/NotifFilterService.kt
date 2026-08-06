package app.notiffilter

import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotifFilterService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifFilter"
        var isConnected: Boolean = false
            private set
        var moduleRef: NotifFilterModule? = null
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

        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val subText = extras.getCharSequence("android.subText")?.toString() ?: ""
        val infoText = extras.getCharSequence("android.infoText")?.toString() ?: ""
        val summaryText = extras.getCharSequence("android.summaryText")?.toString() ?: ""

        val textLines = extras.getCharSequenceArray("android.textLines")
        val textLinesStr = textLines?.joinToString(" | ") ?: ""

        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        Log.i(TAG, "Notification posted — " +
                "app=${sbn.packageName} " +
                "title=$title " +
                "text=$text " +
                "subText=$subText " +
                "infoText=$infoText " +
                "summaryText=$summaryText " +
                "textLines=$textLinesStr " +
                "bigText=$bigText " +
                "postTime=${sbn.postTime} " +
                "ongoing=${notification.flags and android.app.Notification.FLAG_ONGOING_EVENT != 0} " +
                "groupKey=${notification.group ?: ""} " +
                "channelId=${notification.channelId ?: ""}"
        )
    }
}
