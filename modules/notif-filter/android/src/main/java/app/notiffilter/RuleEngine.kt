package app.notiffilter

import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException

data class Rule(
    val id: String,
    val label: String?,
    val enabled: Boolean,
    val scopeKind: String,
    val scopePackages: List<String>,
    val field: String,
    val pattern: String,
    val caseInsensitive: Boolean,
    val action: String,
    val updatedAt: Long
)

data class NotificationContent(
    val packageName: String,
    val title: String,
    val text: String,
    val subText: String,
    val bigText: String,
    val summaryText: String,
    val infoText: String,
    val textLines: String,
    val isOngoing: Boolean
) {
    /**
     * Extract from a [StatusBarNotification]'s extras bundle.
     * Caller must provide the notification's package name, ongoing flag,
     * and the extras Bundle from sbn.notification.extras.
     */
    companion object {
        fun fromExtras(
            packageName: String,
            extras: android.os.Bundle,
            isOngoing: Boolean
        ): NotificationContent {
            val textLines = extras.getCharSequenceArray("android.textLines")
                ?.joinToString(" | ") ?: ""
            return NotificationContent(
                packageName = packageName,
                title = extras.getCharSequence("android.title")?.toString() ?: "",
                text = extras.getCharSequence("android.text")?.toString() ?: "",
                subText = extras.getCharSequence("android.subText")?.toString() ?: "",
                bigText = extras.getCharSequence("android.bigText")?.toString() ?: "",
                summaryText = extras.getCharSequence("android.summaryText")?.toString() ?: "",
                infoText = extras.getCharSequence("android.infoText")?.toString() ?: "",
                textLines = textLines,
                isOngoing = isOngoing
            )
        }
    }
}

enum class Decision { ALLOW, BLOCK }

data class EvaluationResult(
    val decision: Decision,
    /** ID of the rule that matched, or null if default policy applied. */
    val ruleId: String?,
    /** The substring that matched the pattern, or null if no single segment. */
    val matchedSegment: String?
)

data class CompiledRule(
    val rule: Rule,
    val pattern: Pattern
)

data class Settings(
    val defaultPolicy: String,
    val filterOngoing: Boolean,
    val logSize: Int,
    val theme: String
)

/**
 * Stateless rule evaluator.
 *
 * Accepts precompiled [CompiledRule] instances (from [RuleStore]) so that
 * [Pattern] objects are compiled once per rules-write, not per notification.
 */
object RuleEngine {
    /** Regex input is capped at this length to guard against catastrophic backtracking. */
    const val MAX_CONTENT_LENGTH = 4096

    /**
     * Evaluate [notification] against [compiledRules] and [settings].
     *
     * Order:
     * 1. Skip ongoing notifications when [filterOngoing] is false.
     * 2. Filter rules by [enabled] and scope match.
     * 3. Check deny rules — first match wins (deny takes priority).
     * 4. Check allow rules.
     * 5. Apply [defaultPolicy]: in block mode, no allow match = BLOCK; otherwise ALLOW.
     */
    fun evaluate(
        notification: NotificationContent,
        compiledRules: List<CompiledRule>,
        defaultPolicy: String,
        filterOngoing: Boolean
    ): EvaluationResult {
        if (notification.isOngoing && !filterOngoing) {
            return EvaluationResult(Decision.ALLOW, null, null)
        }

        val candidates = compiledRules.filter { compiled ->
            val r = compiled.rule
            r.enabled && (r.scopeKind == "all" || r.scopePackages.contains(notification.packageName))
        }

        // Deny wins — check first
        for (compiled in candidates) {
            if (compiled.rule.action != "deny") continue
            val matched = tryMatch(compiled, notification)
            if (matched != null) {
                return EvaluationResult(Decision.BLOCK, compiled.rule.id, matched)
            }
        }

        for (compiled in candidates) {
            if (compiled.rule.action != "allow") continue
            val matched = tryMatch(compiled, notification)
            if (matched != null) {
                return EvaluationResult(Decision.ALLOW, compiled.rule.id, matched)
            }
        }

        return if (defaultPolicy == "block") {
            EvaluationResult(Decision.BLOCK, null, null)
        } else {
            EvaluationResult(Decision.ALLOW, null, null)
        }
    }

    /**
     * Test a single pattern against sample text.
     * Used by the module's testPattern method for live preview in the rule editor.
     *
     * @return The matched substring, or null if no match / invalid regex.
     */
    fun testSinglePattern(
        pattern: String,
        caseInsensitive: Boolean,
        field: String,
        title: String,
        text: String
    ): String? {
        val notification = NotificationContent(
            packageName = "",
            title = title,
            text = text,
            subText = "",
            bigText = "",
            summaryText = "",
            infoText = "",
            textLines = "",
            isOngoing = false
        )
        val target = buildMatchTarget(field, notification)
        val capped = target.take(MAX_CONTENT_LENGTH)
        return try {
            val flags = if (caseInsensitive) Pattern.CASE_INSENSITIVE else 0
            val p = Pattern.compile(pattern, flags)
            val m = p.matcher(capped)
            if (m.find()) m.group() else null
        } catch (_: PatternSyntaxException) {
            null
        }
    }

    /** Compile a list of [Rule]s into [CompiledRule]s. Invalid patterns are skipped. */
    fun compile(rules: List<Rule>): List<CompiledRule> {
        return rules.mapNotNull { rule ->
            try {
                val flags = if (rule.caseInsensitive) Pattern.CASE_INSENSITIVE else 0
                CompiledRule(rule, Pattern.compile(rule.pattern, flags))
            } catch (_: PatternSyntaxException) {
                null
            }
        }
    }

    private fun tryMatch(
        compiled: CompiledRule,
        notification: NotificationContent
    ): String? {
        val target = buildMatchTarget(compiled.rule.field, notification)
        val capped = target.take(MAX_CONTENT_LENGTH)
        val m = compiled.pattern.matcher(capped)
        return if (m.find()) m.group() else null
    }

    private fun buildMatchTarget(field: String, notification: NotificationContent): String {
        return when (field) {
            "title" -> notification.title
            "text"  -> notification.text
            "any"   -> listOf(
                notification.title, notification.text, notification.subText,
                notification.bigText, notification.summaryText, notification.infoText,
                notification.textLines
            ).joinToString(" ")
            else    -> notification.title
        }
    }
}
