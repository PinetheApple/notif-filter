package app.notiffilter

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Persists rules and settings to [SharedPreferences].
 *
 * Keeps an in-memory cache of [CompiledRule]s so that [Pattern] objects are
 * recompiled only on write. Call [saveRules] to update both the persisted
 * JSON and the compiled cache atomically.
 *
 * The service holds a reference to the store and reads the compiled cache
 * on every [onNotificationPosted] callback — no disk I/O in the hot path.
 *
 * Use [get] rather than the constructor: the JS bridge and the service run in
 * one process and must share the cache, or writes from JS never reach the
 * service. The constructor stays public for tests that need isolation.
 */
class RuleStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** In-memory cache — the service reads this, not the raw prefs. */
    @Volatile
    var compiledRules: List<CompiledRule> = emptyList()
        private set

    @Volatile
    var settings: Settings = Settings(
        defaultPolicy = "allow",
        filterOngoing = false,
        logSize = 500,
        theme = "system"
    )
        private set

    /** Called when rules or settings change. The service reloads from the store. */
    var onChange: (() -> Unit)? = null

    init {
        reload()
    }

    /** Parse + compile + persist + notify. */
    fun saveRules(json: String) {
        prefs.edit().putString(KEY_RULES, json).apply()
        compiledRules = RuleEngine.compile(parseRules(json))
        onChange?.invoke()
    }

    /** Serialize current compiled rules back to JSON. */
    fun rulesToJson(): String {
        val arr = JSONArray()
        for (compiled in compiledRules) {
            arr.put(ruleToJson(compiled.rule))
        }
        return arr.toString()
    }

    /** Load rules from prefs into the compiled cache (no notification). */
    private fun reload() {
        val raw = prefs.getString(KEY_RULES, "[]") ?: "[]"
        settings = loadSettings()
        compiledRules = RuleEngine.compile(parseRules(raw))
    }

    fun saveSettings(json: String) {
        prefs.edit().putString(KEY_SETTINGS, json).apply()
        settings = parseSettings(json)
        onChange?.invoke()
    }

    fun settingsToJson(): String = settingsToJson(settings)

    private fun loadSettings(): Settings {
        val raw = prefs.getString(KEY_SETTINGS, null) ?: return Settings(
            defaultPolicy = "allow",
            filterOngoing = false,
            logSize = 500,
            theme = "system"
        )
        return parseSettings(raw)
    }

    companion object {
        private const val PREFS_NAME = "notif_filter_rules"
        private const val KEY_RULES = "rules"
        private const val KEY_SETTINGS = "settings"

        @Volatile
        private var instance: RuleStore? = null

        /**
         * The process-wide store. Built on the application context so holding it
         * in a static field cannot leak a Service or Activity.
         */
        fun get(context: Context): RuleStore =
            instance ?: synchronized(this) {
                instance ?: RuleStore(context.applicationContext).also { instance = it }
            }

        fun parseRules(json: String): List<Rule> {
            val arr = JSONArray(json)
            val rules = mutableListOf<Rule>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val scopeKind = obj.optString("scopeKind", "all")
                val scopePackages = if (scopeKind == "packages") {
                    val pkgs = obj.optJSONArray("scopePackages")
                    if (pkgs != null) {
                        (0 until pkgs.length()).map { pkgs.getString(it) }
                    } else emptyList()
                } else emptyList()

                rules.add(Rule(
                    id = obj.getString("id"),
                    label = if (obj.has("label") && !obj.isNull("label")) obj.getString("label") else null,
                    enabled = obj.optBoolean("enabled", true),
                    scopeKind = scopeKind,
                    scopePackages = scopePackages,
                    field = obj.optString("field", "any"),
                    pattern = obj.getString("pattern"),
                    caseInsensitive = obj.optBoolean("caseInsensitive", false),
                    action = obj.optString("action", "deny"),
                    updatedAt = obj.optLong("updatedAt", 0)
                ))
            }
            return rules
        }

        fun parseSettings(json: String): Settings {
            val obj = JSONObject(json)
            val ignored = obj.optJSONArray("ignoredPackages")
            return Settings(
                defaultPolicy = obj.optString("defaultPolicy", "allow"),
                filterOngoing = obj.optBoolean("filterOngoing", false),
                logSize = obj.optInt("logSize", 500),
                theme = obj.optString("theme", "system"),
                onboardingDone = obj.optBoolean("onboardingDone", false),
                ignoredPackages = if (ignored != null) {
                    (0 until ignored.length()).map { ignored.getString(it) }
                } else emptyList(),
                batteryPromptShown = obj.optBoolean("batteryPromptShown", false)
            )
        }

        fun settingsToJson(settings: Settings): String {
            val obj = JSONObject()
            obj.put("defaultPolicy", settings.defaultPolicy)
            obj.put("filterOngoing", settings.filterOngoing)
            obj.put("logSize", settings.logSize)
            obj.put("theme", settings.theme)
            obj.put("onboardingDone", settings.onboardingDone)
            obj.put("ignoredPackages", JSONArray(settings.ignoredPackages))
            obj.put("batteryPromptShown", settings.batteryPromptShown)
            return obj.toString()
        }

        fun ruleToJson(rule: Rule): JSONObject {
            val obj = JSONObject()
            obj.put("id", rule.id)
            obj.put("label", rule.label ?: JSONObject.NULL)
            obj.put("enabled", rule.enabled)
            obj.put("scopeKind", rule.scopeKind)
            if (rule.scopeKind == "packages") {
                obj.put("scopePackages", JSONArray(rule.scopePackages))
            }
            obj.put("field", rule.field)
            obj.put("pattern", rule.pattern)
            obj.put("caseInsensitive", rule.caseInsensitive)
            obj.put("action", rule.action)
            obj.put("updatedAt", rule.updatedAt)
            return obj
        }
    }
}
