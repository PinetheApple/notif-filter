package app.notiffilter

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Regression guard for the JS bridge and the listener service holding separate
 * stores: a save through one reference was invisible to the other until rebind.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class RuleStoreInstanceTest {

    private fun store() = RuleStore.get(RuntimeEnvironment.getApplication())

    @Test
    fun `get returns the same instance for every caller`() {
        assertSame(store(), store())
    }

    @Test
    fun `the constructor still builds an isolated instance`() {
        assertNotSame(store(), RuleStore(RuntimeEnvironment.getApplication()))
    }

    @Test
    fun `settings saved through one reference are visible through another`() {
        val bridge = store()
        val service = store()
        bridge.saveSettings("""{"defaultPolicy":"block","ignoredPackages":["com.a"]}""")
        assertEquals("block", service.settings.defaultPolicy)
        assertEquals(listOf("com.a"), service.settings.ignoredPackages)
    }

    @Test
    fun `rules saved through one reference are visible through another`() {
        val bridge = store()
        val service = store()
        bridge.saveRules(
            """[{"id":"r1","pattern":"promo","scopeKind":"all","field":"any","action":"deny"}]"""
        )
        assertEquals(1, service.compiledRules.size)
        assertEquals("r1", service.compiledRules[0].rule.id)

        bridge.saveRules("[]")
        assertTrue(service.compiledRules.isEmpty())
    }

    @Test
    fun `onChange registered on one reference fires for a save through another`() {
        val service = store()
        val bridge = store()
        var fired = 0
        service.onChange = { fired++ }
        try {
            bridge.saveRules("[]")
            bridge.saveSettings("""{"defaultPolicy":"allow"}""")
        } finally {
            service.onChange = null
        }
        assertEquals(2, fired)
    }
}
