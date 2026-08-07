package app.notiffilter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.provider.Settings
import android.util.Base64
import android.util.LruCache
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class NotifFilterModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    private val listenerConnected
        get() = NotifFilterService.isConnected

    private val ruleStore by lazy { RuleStore(context) }
    private val historyStore by lazy { HistoryStore(context) }

    /** Simple in-memory cache for app icons (max ~50 entries). */
    private val iconCache = LruCache<String, String>(50)

    override fun definition() = ModuleDefinition {
        Name("NotifFilter")

        Events("onListenerConnectionChanged")

        Function("isListenerEnabled") {
            NotifFilterService.isEnabled(context)
        }

        AsyncFunction("openNotificationAccessSettings") {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }

        Function("getRules") {
            ruleStore.rulesToJson()
        }

        Function("saveRules") { json: String ->
            ruleStore.saveRules(json)
        }

        Function("getSettings") {
            ruleStore.settingsToJson()
        }

        Function("saveSettings") { json: String ->
            ruleStore.saveSettings(json)
        }

        Function("listInstalledApps") {
            val pm = context.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            val activities = pm.queryIntentActivities(mainIntent, 0)
            val seen = NotifFilterService.seenPackages

            activities.map { ri ->
                mapOf(
                    "package" to ri.activityInfo.packageName,
                    "label" to ri.loadLabel(pm).toString(),
                    "hasPosted" to seen.contains(ri.activityInfo.packageName)
                )
            }.sortedBy { (it["label"] as String).lowercase() }
        }

        Function("getAppIcon") { packageName: String ->
            iconCache.get(packageName) ?: run {
                val pm = context.packageManager
                val drawable: Drawable? = try {
                    pm.getApplicationIcon(packageName)
                } catch (_: PackageManager.NameNotFoundException) {
                    null
                }
                val base64 = drawable?.let { drawableToBase64(it) } ?: ""
                if (base64.isNotEmpty()) iconCache.put(packageName, base64)
                base64
            }
        }

        Function("getSeenPackages") {
            NotifFilterService.seenPackages.toList()
        }

        Function("testPattern") { pattern: String, caseInsensitive: Boolean, title: String, text: String ->
            val matched = RuleEngine.testSinglePattern(pattern, caseInsensitive, "any", title, text)
            mapOf(
                "matches" to (matched != null),
                "matchedSegment" to (matched ?: "")
            )
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

        Function("getHistoryEntries") { limit: Int, beforeTs: Double? ->
            val before = if (beforeTs != null) beforeTs.toLong() else null
            val entries = historyStore.query(limit, before)
            historyStore.entriesToJson(entries)
        }

        Function("clearHistory") {
            historyStore.deleteAll()
        }

        AsyncFunction("restoreEntry") { id: String ->
            val entry = historyStore.getById(id)
                ?: throw IllegalStateException("Entry not found: $id")
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager

            val channelId = "restored"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Restored",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Restored notifications"
                }
                manager.createNotificationChannel(channel)
            }

            val nb = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(context, channelId)
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(context)
            }
            nb.setContentTitle(entry.title)
            nb.setContentText(entry.text)
            nb.setSmallIcon(android.R.drawable.ic_dialog_info)

            manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), nb.build())
        }

        OnStartObserving("onListenerConnectionChanged") {
            NotifFilterService.moduleRef = this@NotifFilterModule
        }

        OnStopObserving("onListenerConnectionChanged") {
            NotifFilterService.moduleRef = null
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val bmp = Bitmap.createBitmap(
                drawable.intrinsicWidth.coerceAtLeast(1),
                drawable.intrinsicHeight.coerceAtLeast(1),
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bmp
        }
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 80, stream)
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }
}
