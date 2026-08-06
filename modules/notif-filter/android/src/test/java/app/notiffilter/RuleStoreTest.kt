package app.notiffilter

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class RuleStoreTest {

    // ── Rule serialization round-trip ─────────────────────────────────────────

    @Test
    fun `parseRules parses a single rule`() {
        val json = """[{"id":"abc","label":"Block promos","enabled":true,"scopeKind":"all","field":"any","pattern":"promo","caseInsensitive":true,"action":"deny","updatedAt":1000}]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(1, rules.size)
        val r = rules[0]
        assertEquals("abc", r.id)
        assertEquals("Block promos", r.label)
        assertTrue(r.enabled)
        assertEquals("all", r.scopeKind)
        assertEquals("any", r.field)
        assertEquals("promo", r.pattern)
        assertTrue(r.caseInsensitive)
        assertEquals("deny", r.action)
        assertEquals(1000L, r.updatedAt)
    }

    @Test
    fun `parseRules handles empty array`() {
        val rules = RuleStore.parseRules("[]")
        assertTrue(rules.isEmpty())
    }

    @Test
    fun `parseRules handles null label`() {
        val json = """[{"id":"1","pattern":"test","scopeKind":"all","action":"deny","field":"any"}]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(1, rules.size)
        assertNull(rules[0].label)
    }

    @Test
    fun `parseRules handles scopeKind packages with scopePackages`() {
        val json = """[{"id":"r1","scopeKind":"packages","scopePackages":["com.foo","com.bar"],"pattern":"test","action":"deny","field":"any"}]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(1, rules.size)
        assertEquals("packages", rules[0].scopeKind)
        assertEquals(listOf("com.foo", "com.bar"), rules[0].scopePackages)
    }

    @Test
    fun `parseRules handles scopeKind packages with empty scopePackages`() {
        val json = """[{"id":"r1","scopeKind":"packages","pattern":"test","action":"deny","field":"any"}]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(1, rules.size)
        assertTrue(rules[0].scopePackages.isEmpty())
    }

    @Test
    fun `parseRules handles missing optional fields with defaults`() {
        val json = """[{"id":"r1","pattern":"test","action":"deny"}]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(1, rules.size)
        val r = rules[0]
        assertEquals("all", r.scopeKind)
        assertEquals("any", r.field)
        assertFalse(r.caseInsensitive)
        assertTrue(r.enabled)
        assertEquals(0L, r.updatedAt)
    }

    @Test
    fun `parseRules handles multiple rules`() {
        val json = """[
            {"id":"r1","pattern":"a","scopeKind":"all","action":"deny","field":"title"},
            {"id":"r2","pattern":"b","scopeKind":"all","action":"allow","field":"text"}
        ]"""
        val rules = RuleStore.parseRules(json)
        assertEquals(2, rules.size)
        assertEquals("a", rules[0].pattern)
        assertEquals("b", rules[1].pattern)
    }

    @Test
    fun `ruleToJson round-trip preserves all fields`() {
        val rule = Rule(
            id = "test-id",
            label = "My Rule",
            enabled = false,
            scopeKind = "packages",
            scopePackages = listOf("com.a", "com.b"),
            field = "text",
            pattern = "spam|promo",
            caseInsensitive = true,
            action = "allow",
            updatedAt = 1234567890
        )
        val json = RuleStore.ruleToJson(rule).toString()
        val parsed = RuleStore.parseRules("[$json]")
        assertEquals(1, parsed.size)
        val r = parsed[0]
        assertEquals(rule.id, r.id)
        assertEquals(rule.label, r.label)
        assertEquals(rule.enabled, r.enabled)
        assertEquals(rule.scopeKind, r.scopeKind)
        assertEquals(rule.scopePackages, r.scopePackages)
        assertEquals(rule.field, r.field)
        assertEquals(rule.pattern, r.pattern)
        assertEquals(rule.caseInsensitive, r.caseInsensitive)
        assertEquals(rule.action, r.action)
        assertEquals(rule.updatedAt, r.updatedAt)
    }

    @Test
    fun `ruleToJson omits scopePackages when scopeKind is all`() {
        val rule = Rule("id", "label", true, "all", emptyList(), "any", ".*", false, "deny", 0)
        val json = RuleStore.ruleToJson(rule)
        assertFalse("scopePackages should not appear for scopeKind=all",
            json.has("scopePackages"))
    }

    @Test
    fun `ruleToJson includes scopePackages when scopeKind is packages`() {
        val rule = Rule("id", "label", true, "packages", listOf("com.x"), "any", ".*", false, "deny", 0)
        val json = RuleStore.ruleToJson(rule)
        assertTrue(json.has("scopePackages"))
    }

    @Test
    fun `ruleToJson writes null label as JSON null`() {
        val rule = Rule("id", null, true, "all", emptyList(), "any", ".*", false, "deny", 0)
        val json = RuleStore.ruleToJson(rule)
        assertEquals(JSONObject.NULL, json.get("label"))
    }

    // ── Settings serialization round-trip ─────────────────────────────────────

    @Test
    fun `parseSettings reads all fields`() {
        val json = """{"defaultPolicy":"block","filterOngoing":true,"logSize":200,"theme":"dark"}"""
        val s = RuleStore.parseSettings(json)
        assertEquals("block", s.defaultPolicy)
        assertTrue(s.filterOngoing)
        assertEquals(200, s.logSize)
        assertEquals("dark", s.theme)
    }

    @Test
    fun `parseSettings applies defaults for missing fields`() {
        val json = """{}"""
        val s = RuleStore.parseSettings(json)
        assertEquals("allow", s.defaultPolicy)
        assertFalse(s.filterOngoing)
        assertEquals(500, s.logSize)
        assertEquals("system", s.theme)
    }

    @Test
    fun `parseSettings handles partial JSON`() {
        val json = """{"defaultPolicy":"block"}"""
        val s = RuleStore.parseSettings(json)
        assertEquals("block", s.defaultPolicy)
        assertFalse(s.filterOngoing)
        assertEquals(500, s.logSize)
    }

    @Test
    fun `parseSettings reads onboardingDone`() {
        val json = """{"defaultPolicy":"allow","onboardingDone":true}"""
        val s = RuleStore.parseSettings(json)
        assertTrue(s.onboardingDone)
    }

    @Test
    fun `parseSettings defaults onboardingDone to false`() {
        val s = RuleStore.parseSettings("""{}""")
        assertFalse(s.onboardingDone)
    }

    @Test
    fun `settingsToJson round-trip preserves onboardingDone`() {
        // Regression guard: JS writes settings keys the service never reads;
        // getSettings() must hand them back intact.
        val s = RuleStore.parseSettings("""{"defaultPolicy":"block","onboardingDone":true}""")
        val out = RuleStore.parseSettings(RuleStore.settingsToJson(s))
        assertTrue(out.onboardingDone)
        assertEquals("block", out.defaultPolicy)
    }

    @Test
    fun `settingsToJson writes all known keys`() {
        val s = Settings("allow", false, 500, "system", true)
        val obj = JSONObject(RuleStore.settingsToJson(s))
        assertEquals("allow", obj.getString("defaultPolicy"))
        assertFalse(obj.getBoolean("filterOngoing"))
        assertEquals(500, obj.getInt("logSize"))
        assertEquals("system", obj.getString("theme"))
        assertTrue(obj.getBoolean("onboardingDone"))
    }

    // ── RuleEngine.compile ────────────────────────────────────────────────────

    @Test
    fun `compile skips invalid patterns`() {
        val rules = listOf(
            Rule("r1", null, true, "all", emptyList(), "any", "[bad", false, "deny", 0),
            Rule("r2", null, true, "all", emptyList(), "any", "valid", false, "deny", 0)
        )
        val compiled = RuleEngine.compile(rules)
        assertEquals(1, compiled.size)
        assertEquals("r2", compiled[0].rule.id)
    }

    @Test
    fun `compile respects caseInsensitive flag`() {
        val rules = listOf(
            Rule("r1", null, true, "all", emptyList(), "any", "HELLO", true, "deny", 0)
        )
        val compiled = RuleEngine.compile(rules)
        assertEquals(1, compiled.size)
        val pattern = compiled[0].pattern
        assertTrue(pattern.matcher("hello").find())
        assertTrue(pattern.matcher("HELLO").find())
    }

    @Test
    fun `compile case sensitive does not match alternate case`() {
        val rules = listOf(
            Rule("r1", null, true, "all", emptyList(), "any", "HELLO", false, "deny", 0)
        )
        val compiled = RuleEngine.compile(rules)
        assertEquals(1, compiled.size)
        val pattern = compiled[0].pattern
        assertTrue(pattern.matcher("HELLO").find())
        assertFalse(pattern.matcher("hello").find())
    }

    // ── RulesToJson round-trip ────────────────────────────────────────────────

    @Test
    fun `rulesToJson produces parseable output`() {
        val rule = Rule("x", "Label", true, "all", emptyList(), "any", "test", true, "deny", 100)
        val json = JSONArray()
        json.put(RuleStore.ruleToJson(rule))
        val parsed = RuleStore.parseRules(json.toString())
        assertEquals(1, parsed.size)
        assertEquals("x", parsed[0].id)
        assertEquals("Label", parsed[0].label)
    }

    @Test
    fun `empty rules list produces empty JSON array`() {
        // Simulate what rulesToJson would produce for empty compiledRules
        val json = JSONArray().toString()
        assertEquals("[]", json)
        val parsed = RuleStore.parseRules(json)
        assertTrue(parsed.isEmpty())
    }
}
