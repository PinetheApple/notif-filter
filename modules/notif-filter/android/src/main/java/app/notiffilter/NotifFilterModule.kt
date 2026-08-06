package app.notiffilter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotifFilterModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    private val listenerConnected
        get() = NotifFilterService.isConnected

    override fun definition() = ModuleDefinition {
        Name("NotifFilter")

        Events("onListenerConnectionChanged")

        Function("isListenerEnabled") {
            NotificationManagerCompat.getEnabledListenerPackages(context)
                .contains(context.packageName)
        }

        AsyncFunction("openNotificationAccessSettings") {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }

        AsyncFunction("postTestNotification") { title: String, text: String ->
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager

            val channelId = "test_notifications"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Test Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Notifications sent by the test harness"
                }
                manager.createNotificationChannel(channel)
            }

            val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(context, channelId)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .build()
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(context)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .build()
            }

            manager.notify(9999, notification)
        }

        OnStartObserving("onListenerConnectionChanged") {
            NotifFilterService.moduleRef = this@NotifFilterModule
        }

        OnStopObserving("onListenerConnectionChanged") {
            NotifFilterService.moduleRef = null
        }
    }
}
