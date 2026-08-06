package app.notiffilter

import org.junit.Assert.*
import org.junit.Test
import java.util.regex.Pattern

class RuleEngineTest {

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun rule(
        id: String = "r1",
        action: String = "deny",
        field: String = "any",
        pattern: String = ".*",
        scopeKind: String = "all",
        scopePackages: List<String> = emptyList(),
        enabled: Boolean = true,
        caseInsensitive: Boolean = false
    ) = Rule(id, null, enabled, scopeKind, scopePackages, field, pattern, caseInsensitive, action, 0)

    private fun compiled(r: Rule) = try {
        CompiledRule(r, Pattern.compile(r.pattern, if (r.caseInsensitive) Pattern.CASE_INSENSITIVE else 0))
    } catch (_: Exception) { null }

    private fun notif(
        title: String = "",
        text: String = "",
        packageName: String = "com.example",
        isOngoing: Boolean = false
    ) = NotificationContent(packageName, title, text, "", "", "", "", "", isOngoing)

    private fun eval(
        notification: NotificationContent,
        rules: List<Rule>,
        defaultPolicy: String = "allow",
        filterOngoing: Boolean = false
    ): EvaluationResult {
        val compiled = rules.mapNotNull { compiled(it) }
        return RuleEngine.evaluate(notification, compiled, defaultPolicy, filterOngoing)
    }

    // ── Deny priority ────────────────────────────────────────────────────────

    @Test
    fun `deny wins over allow when both match`() {
        val rules = listOf(
            rule(id = "allow", action = "allow", pattern = "hello"),
            rule(id = "deny", action = "deny", pattern = "hello")
        )
        val result = eval(notif(title = "hello"), rules)
        assertEquals(Decision.BLOCK, result.decision)
        assertEquals("deny", result.ruleId)
    }

    @Test
    fun `allow wins when deny does not match`() {
        val rules = listOf(
            rule(id = "deny", action = "deny", pattern = "spam"),
            rule(id = "allow", action = "allow", pattern = "hello")
        )
        val result = eval(notif(title = "hello"), rules)
        assertEquals(Decision.ALLOW, result.decision)
        assertEquals("allow", result.ruleId)
    }

    // ── Default policies ─────────────────────────────────────────────────────

    @Test
    fun `allowlist mode — no allow match blocks notification`() {
        val rules = listOf(
            rule(id = "allow-on", action = "allow", pattern = "friend")
        )
        val result = eval(notif(title = "spam"), rules, defaultPolicy = "block")
        assertEquals(Decision.BLOCK, result.decision)
        assertNull(result.ruleId)
    }

    @Test
    fun `allowlist mode — allow match lets notification through`() {
        val rules = listOf(
            rule(id = "allow-on", action = "allow", pattern = "friend")
        )
        val result = eval(notif(title = "friend"), rules, defaultPolicy = "block")
        assertEquals(Decision.ALLOW, result.decision)
        assertEquals("allow-on", result.ruleId)
    }

    @Test
    fun `denylist mode — no deny match allows notification`() {
        val rules = listOf(
            rule(id = "block-spam", action = "deny", pattern = "spam")
        )
        val result = eval(notif(title = "hello"), rules, defaultPolicy = "allow")
        assertEquals(Decision.ALLOW, result.decision)
        assertNull(result.ruleId)
    }

    @Test
    fun `denylist mode — deny match blocks notification`() {
        val result = eval(
            notif(title = "spam here"),
            listOf(rule(id = "block-spam", action = "deny", pattern = "spam")),
            defaultPolicy = "allow"
        )
        assertEquals(Decision.BLOCK, result.decision)
        assertEquals("block-spam", result.ruleId)
    }

    // ── Scope matching ───────────────────────────────────────────────────────

    @Test
    fun `scope all matches any package`() {
        val rules = listOf(rule(id = "r1", scopeKind = "all", pattern = "hello"))
        val result = eval(notif(title = "hello", packageName = "com.foo"), rules)
        assertEquals(Decision.BLOCK, result.decision)
    }

    @Test
    fun `scope packages matches only listed packages`() {
        val rules = listOf(
            rule(id = "r1", scopeKind = "packages", scopePackages = listOf("com.foo"), pattern = "hello")
        )
        val match = eval(notif(title = "hello", packageName = "com.foo"), rules)
        assertEquals(Decision.BLOCK, match.decision)

        val noMatch = eval(notif(title = "hello", packageName = "com.bar"), rules)
        assertEquals(Decision.ALLOW, noMatch.decision)
    }

    @Test
    fun `disabled rule is skipped`() {
        val rules = listOf(
            rule(id = "r1", pattern = "hello", enabled = false)
        )
        val result = eval(notif(title = "hello"), rules)
        assertEquals(Decision.ALLOW, result.decision)
        assertNull(result.ruleId)
    }

    // ── Field extraction ─────────────────────────────────────────────────────

    @Test
    fun `field title matches only title`() {
        val rules = listOf(rule(id = "r1", field = "title", pattern = "News"))
        val match = eval(notif(title = "News alert", text = "nothing"), rules)
        assertEquals(Decision.BLOCK, match.decision)

        val noMatch = eval(notif(title = "Alert", text = "News inside"), rules)
        assertEquals(Decision.ALLOW, noMatch.decision)
    }

    @Test
    fun `field text matches only text`() {
        val rules = listOf(rule(id = "r1", field = "text", pattern = "sale"))
        val match = eval(notif(title = "Hello", text = "big sale today"), rules)
        assertEquals(Decision.BLOCK, match.decision)

        val noMatch = eval(notif(title = "sale alert", text = "hello"), rules)
        assertEquals(Decision.ALLOW, noMatch.decision)
    }

    @Test
    fun `field any matches title or text`() {
        val rules = listOf(rule(id = "r1", field = "any", pattern = "promo"))
        val titleMatch = eval(notif(title = "promo code", text = "x"), rules)
        assertEquals(Decision.BLOCK, titleMatch.decision)

        val textMatch = eval(notif(title = "x", text = "get your promo"), rules)
        assertEquals(Decision.BLOCK, textMatch.decision)
    }

    @Test
    fun `field any includes subText and bigText`() {
        val rules = listOf(rule(id = "r1", field = "any", pattern = "deal"))
        val notif = NotificationContent("com.x", "title", "text", "sub deal here", "", "", "", "", false)
        val result = eval(notif, rules)
        assertEquals(Decision.BLOCK, result.decision)
    }

    @Test
    fun `field any includes textLines`() {
        val rules = listOf(rule(id = "r1", field = "any", pattern = "offer"))
        val notif = NotificationContent("com.x", "title", "text", "", "", "", "", "line1 | offer | line3", false)
        val result = eval(notif, rules)
        assertEquals(Decision.BLOCK, result.decision)
    }

    // ── Case sensitivity ─────────────────────────────────────────────────────

    @Test
    fun `case insensitive matches regardless of case`() {
        val ci = rule(id = "r1", pattern = "Hello", caseInsensitive = true)
        assertEquals(Decision.BLOCK, eval(notif(title = "hello"), listOf(ci)).decision)
        assertEquals(Decision.BLOCK, eval(notif(title = "HELLO"), listOf(ci)).decision)
        assertEquals(Decision.BLOCK, eval(notif(title = "Hello"), listOf(ci)).decision)
    }

    @Test
    fun `case sensitive matches exact case`() {
        val cs = rule(id = "r1", pattern = "Hello", caseInsensitive = false)
        assertEquals(Decision.BLOCK, eval(notif(title = "Hello"), listOf(cs)).decision)
        assertEquals(Decision.ALLOW, eval(notif(title = "hello"), listOf(cs)).decision)
        assertEquals(Decision.ALLOW, eval(notif(title = "HELLO"), listOf(cs)).decision)
    }

    // ── Matched segment ──────────────────────────────────────────────────────

    @Test
    fun `matched segment captures the actual match`() {
        val rules = listOf(rule(id = "r1", pattern = "sale|promo", caseInsensitive = true))
        val result = eval(notif(title = "big Promo today"), rules)
        assertEquals("Promo", result.matchedSegment)
    }

    // ── Ongoing notifications ────────────────────────────────────────────────

    @Test
    fun `ongoing notification skipped when filterOngoing is false`() {
        val rules = listOf(rule(id = "r1", pattern = "anything"))
        val result = eval(notif(title = "anything", isOngoing = true), rules, filterOngoing = false)
        assertEquals(Decision.ALLOW, result.decision)
        assertNull(result.ruleId)
    }

    @Test
    fun `ongoing notification filtered when filterOngoing is true`() {
        val rules = listOf(rule(id = "r1", pattern = "anything"))
        val result = eval(notif(title = "anything", isOngoing = true), rules, filterOngoing = true)
        assertEquals(Decision.BLOCK, result.decision)
        assertEquals("r1", result.ruleId)
    }

    @Test
    fun `non-ongoing notification always checked regardless of filterOngoing`() {
        val rules = listOf(rule(id = "r1", pattern = "test"))
        val result = eval(notif(title = "test", isOngoing = false), rules, filterOngoing = false)
        assertEquals(Decision.BLOCK, result.decision)
    }

    // ── Empty rules ──────────────────────────────────────────────────────────

    @Test
    fun `empty rules with allow default — all notifications through`() {
        val result = eval(notif(title = "whatever"), emptyList(), defaultPolicy = "allow")
        assertEquals(Decision.ALLOW, result.decision)
        assertNull(result.ruleId)
    }

    @Test
    fun `empty rules with block default — all notifications blocked`() {
        val result = eval(notif(title = "whatever"), emptyList(), defaultPolicy = "block")
        assertEquals(Decision.BLOCK, result.decision)
        assertNull(result.ruleId)
    }

    // ── Invalid regex ────────────────────────────────────────────────────────

    @Test
    fun `invalid regex is skipped — does not crash`() {
        val rules = listOf(
            rule(id = "bad", pattern = "[unclosed")
        )
        val compiled = RuleEngine.compile(rules)
        assertTrue("Invalid regex should be skipped during compile", compiled.isEmpty())

        val result = eval(notif(title = "anything"), rules)
        assertEquals(Decision.ALLOW, result.decision)
    }

    @Test
    fun `invalid regex skipped — valid rule still matches`() {
        val rules = listOf(
            rule(id = "bad", pattern = "[unclosed"),
            rule(id = "good", pattern = "hello")
        )
        val compiled = RuleEngine.compile(rules)
        assertEquals(1, compiled.size)
        assertEquals("good", compiled[0].rule.id)

        val result = eval(notif(title = "hello"), rules)
        assertEquals(Decision.BLOCK, result.decision)
        assertEquals("good", result.ruleId)
    }

    // ── Content cap ──────────────────────────────────────────────────────────

    @Test
    fun `content is capped at 4 KB`() {
        // Build a rule that looks for "TARGET" at the very end of a 5000-char string
        val longText = "x".repeat(5000) + "TARGET"
        val rules = listOf(rule(id = "r1", field = "text", pattern = "TARGET"))
        val result = eval(notif(text = longText), rules)
        // "TARGET" is beyond the 4096 cap, so it should NOT match
        assertEquals(Decision.ALLOW, result.decision)
    }

    @Test
    fun `content within cap still matches`() {
        val text = "x".repeat(100) + "TARGET"
        val rules = listOf(rule(id = "r1", field = "text", pattern = "TARGET"))
        val result = eval(notif(text = text), rules)
        assertEquals(Decision.BLOCK, result.decision)
    }

    @Test
    fun `cap limit is exactly MAX_CONTENT_LENGTH`() {
        val text = "A".repeat(RuleEngine.MAX_CONTENT_LENGTH - 5) + "MATCH"
        val rules = listOf(rule(id = "r1", field = "text", pattern = "MATCH"))
        val result = eval(notif(text = text), rules)
        assertEquals(Decision.BLOCK, result.decision)
    }

    // ── testSinglePattern ────────────────────────────────────────────────────

    @Test
    fun `testSinglePattern matches against any field`() {
        val matched = RuleEngine.testSinglePattern("hello", false, "any", "hello world", "text body")
        assertEquals("hello", matched)
    }

    @Test
    fun `testSinglePattern returns null on no match`() {
        val matched = RuleEngine.testSinglePattern("xyz", false, "any", "hello", "world")
        assertNull(matched)
    }

    @Test
    fun `testSinglePattern returns null on invalid regex`() {
        val matched = RuleEngine.testSinglePattern("[bad", false, "any", "test", "test")
        assertNull(matched)
    }

    // ── Multiple rules, first-match ordering ─────────────────────────────────

    @Test
    fun `first deny match wins among multiple deny rules`() {
        val rules = listOf(
            rule(id = "r1", action = "deny", pattern = "sale"),
            rule(id = "r2", action = "deny", pattern = "promo")
        )
        val result = eval(notif(title = "sale and promo"), rules)
        assertEquals(Decision.BLOCK, result.decision)
        assertEquals("r1", result.ruleId)
    }
}
