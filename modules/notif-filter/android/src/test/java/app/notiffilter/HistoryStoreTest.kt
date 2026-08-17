package app.notiffilter

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HistoryStoreTest {

    private fun store() = HistoryStore(RuntimeEnvironment.getApplication())

    private fun entry(id: String, ts: Long) = HistoryEntry(
        id = id,
        packageName = "com.example.app",
        appLabel = "Example",
        title = "Title $id",
        text = "Text $id",
        disposition = "shown",
        ruleId = null,
        ruleLabel = null,
        matchedSegment = null,
        timestamp = ts,
        postTime = ts
    )

    /** Mirrors the service's reconnect loop: record only what history does not have. */
    private fun backfill(store: HistoryStore, keys: List<Pair<String, Long>>): Int {
        var written = 0
        for ((key, postTime) in keys) {
            val id = HistoryEntry.deriveId(key, postTime)
            if (store.exists(id)) continue
            store.insert(entry(id, postTime).copy(notifKey = key, recovered = true))
            written++
        }
        return written
    }

    @Test
    fun insertThenQueryReturnsTheEntry() {
        val store = store()
        store.insert(entry("a", 100L))

        val entries = store.query(10, null)

        assertEquals(1, entries.size)
        assertEquals("a", entries[0].id)
    }

    @Test
    fun queryOnEmptyDatabaseReturnsNothing() {
        assertEquals(0, store().query(10, null).size)
    }

    // ── Backfill identity and dedup ───────────────────────────────────────────

    @Test
    fun `deriveId is stable for the same notification across posts`() {
        assertEquals(
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 500L),
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 501L)
        )
    }

    @Test
    fun `deriveId falls back to postTime when the key is missing`() {
        assertNotEquals(
            HistoryEntry.deriveId("", 500L),
            HistoryEntry.deriveId("", 501L)
        )
    }

    @Test
    fun `deriveId separates different keys at the same postTime`() {
        assertNotEquals(
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 500L),
            HistoryEntry.deriveId("0|com.slack|1|tag|10123", 500L)
        )
    }

    @Test
    fun `exists is false before insert and true after`() {
        val store = store()
        val id = HistoryEntry.deriveId("0|com.gmail|1|null|10123", 500L)

        assertFalse(store.exists(id))
        store.insert(entry(id, 500L))
        assertTrue(store.exists(id))
    }

    @Test
    fun `repeated backfill of the same notifications writes each row once`() {
        val store = store()
        val active = listOf("0|com.gmail|1|null|1" to 100L, "0|com.slack|2|null|1" to 200L)

        assertEquals(2, backfill(store, active))
        assertEquals(0, backfill(store, active))
        assertEquals(0, backfill(store, active))

        assertEquals(2, store.query(10, null).size)
    }

    @Test
    fun `backfill skips a notification already recorded live`() {
        val store = store()
        val key = "0|com.gmail|1|null|1"
        val id = HistoryEntry.deriveId(key, 100L)
        store.insert(entry(id, 100L).copy(notifKey = key, disposition = "blocked"))

        assertEquals(0, backfill(store, listOf(key to 100L)))

        val stored = store.query(10, null).single()
        assertEquals("blocked", stored.disposition)
        assertFalse("live row must not be re-marked as recovered", stored.recovered)
    }

    @Test
    fun `backfill skips a repost of an already recorded notification`() {
        val store = store()
        val key = "0|com.gmail|1|null|1"
        store.insert(entry(HistoryEntry.deriveId(key, 100L), 100L).copy(notifKey = key))

        assertEquals(0, backfill(store, listOf(key to 684L)))

        assertEquals(1, store.query(10, null).size)
    }

    @Test
    fun `reinserting the same derived id replaces rather than duplicates`() {
        val store = store()
        val id = HistoryEntry.deriveId("0|com.gmail|1|null|1", 100L)

        store.insert(entry(id, 100L))
        store.insert(entry(id, 100L).copy(title = "Updated"))

        val entries = store.query(10, null)
        assertEquals(1, entries.size)
        assertEquals("Updated", entries[0].title)
    }

    @Test
    fun `a repost updates the row in place and keeps its feed position`() {
        val store = store()
        val key = "0|com.example.app|1|null|10416"

        store.insert(entry(HistoryEntry.deriveId(key, 500L), 500L).copy(notifKey = key))
        store.insert(entry(HistoryEntry.deriveId(key, 684L), 684L).copy(notifKey = key, title = "Updated"))

        val stored = store.query(10, null).single()
        assertEquals("Updated", stored.title)
        assertEquals(500L, stored.timestamp)
        assertEquals(684L, stored.postTime)
    }

    // ── New columns ───────────────────────────────────────────────────────────

    @Test
    fun `expanded content columns round-trip through the database`() {
        val store = store()
        store.insert(
            entry("a", 100L).copy(
                subText = "Inbox",
                bigText = "The full email body\nover several lines",
                summaryText = "2 new messages",
                infoText = "info",
                textLines = "line one | line two",
                notifKey = "0|com.gmail|1|null|1",
                recovered = true
            )
        )

        val stored = store.query(10, null).single()
        assertEquals("Inbox", stored.subText)
        assertEquals("The full email body\nover several lines", stored.bigText)
        assertEquals("2 new messages", stored.summaryText)
        assertEquals("info", stored.infoText)
        assertEquals("line one | line two", stored.textLines)
        assertEquals("0|com.gmail|1|null|1", stored.notifKey)
        assertTrue(stored.recovered)
    }

    @Test
    fun `expanded content columns default to empty when not supplied`() {
        val store = store()
        store.insert(entry("a", 100L))

        val stored = store.query(10, null).single()
        assertEquals("", stored.subText)
        assertEquals("", stored.bigText)
        assertEquals("", stored.summaryText)
        assertEquals("", stored.infoText)
        assertEquals("", stored.textLines)
        assertEquals("", stored.notifKey)
        assertFalse(stored.recovered)
    }

    @Test
    fun `an oversized body is truncated instead of stored whole`() {
        val store = store()
        val huge = "x".repeat(10_000)
        store.insert(entry("a", 100L).copy(bigText = huge, textLines = huge))

        val stored = store.query(10, null).single()
        assertEquals(4096, stored.bigText.length)
        assertEquals(4096, stored.textLines.length)
    }

    @Test
    fun `entriesToJson carries the new fields to the bridge`() {
        val store = store()
        val entry = entry("a", 100L).copy(
            subText = "Inbox",
            bigText = "Full body",
            summaryText = "Summary",
            infoText = "Info",
            textLines = "one | two",
            notifKey = "0|com.gmail|1|null|1",
            recovered = true
        )

        val obj = JSONArray(store.entriesToJson(listOf(entry))).getJSONObject(0)

        assertEquals("Inbox", obj.getString("subText"))
        assertEquals("Full body", obj.getString("bigText"))
        assertEquals("Summary", obj.getString("summaryText"))
        assertEquals("Info", obj.getString("infoText"))
        assertEquals("one | two", obj.getString("textLines"))
        assertEquals("0|com.gmail|1|null|1", obj.getString("notifKey"))
        assertTrue(obj.getBoolean("recovered"))
    }

    // ── Pruning ────────────────────────────────────────────────────────────────

    @Test
    fun `insert prunes to the configured log size`() {
        val store = store()
        for (i in 1..10) {
            store.insert(entry("e$i", i.toLong()), maxEntries = 5)
        }

        val entries = store.query(10, null)

        assertEquals(5, entries.size)
        assertEquals("e10", entries.first().id)
        assertEquals("e6", entries.last().id)
    }

    @Test
    fun `insert keeps every row under the default limit`() {
        val store = store()
        for (i in 1..10) {
            store.insert(entry("e$i", i.toLong()))
        }

        assertEquals(10, store.query(20, null).size)
    }

    // ── Search, filter, sort ───────────────────────────────────────────────────

    /** Four rows spanning both dispositions and two packages, timestamps 100..400. */
    private fun seedMixed(store: HistoryStore) {
        store.insert(
            entry("a", 100L).copy(
                packageName = "com.gmail", appLabel = "Gmail",
                title = "Standup notes", text = "meeting at nine", disposition = "shown"
            )
        )
        store.insert(
            entry("b", 200L).copy(
                packageName = "com.slack", appLabel = "Slack",
                title = "Deploy failed", text = "build 12 broke", disposition = "blocked"
            )
        )
        store.insert(
            entry("c", 300L).copy(
                packageName = "com.gmail", appLabel = "Gmail",
                title = "Invoice", text = "standup billing", disposition = "blocked"
            )
        )
        store.insert(
            entry("d", 400L).copy(
                packageName = "com.maps", appLabel = "Standup Maps",
                title = "Traffic", text = "slow on route", disposition = "shown"
            )
        )
    }

    @Test
    fun `query matches title text and app label case-insensitively`() {
        val store = store()
        seedMixed(store)

        val ids = store.query(10, null, query = "STANDUP").map { it.id }

        assertEquals(listOf("d", "c", "a"), ids)
    }

    @Test
    fun `query excludes rows the text does not match`() {
        val store = store()
        seedMixed(store)

        assertEquals(listOf("b"), store.query(10, null, query = "deploy").map { it.id })
    }

    @Test
    fun `wildcards in the query are matched literally`() {
        val store = store()
        store.insert(entry("a", 100L).copy(title = "100% done"))
        store.insert(entry("b", 200L).copy(title = "nothing here"))

        assertEquals(listOf("a"), store.query(10, null, query = "100%").map { it.id })
        assertEquals(0, store.query(10, null, query = "%_%").size)
    }

    @Test
    fun `package filter keeps only the listed packages`() {
        val store = store()
        seedMixed(store)

        val ids = store.query(10, null, packages = listOf("com.gmail", "com.maps")).map { it.id }

        assertEquals(listOf("d", "c", "a"), ids)
    }

    @Test
    fun `disposition filter keeps only that disposition`() {
        val store = store()
        seedMixed(store)

        assertEquals(listOf("c", "b"), store.query(10, null, disposition = "blocked").map { it.id })
    }

    @Test
    fun `text package and disposition filters compose`() {
        val store = store()
        seedMixed(store)

        val ids = store.query(
            10, null,
            query = "standup",
            packages = listOf("com.gmail"),
            disposition = "blocked"
        ).map { it.id }

        assertEquals(listOf("c"), ids)
    }

    @Test
    fun `ascending order returns oldest first`() {
        val store = store()
        seedMixed(store)

        val ids = store.query(10, null, ascending = true).map { it.id }

        assertEquals(listOf("a", "b", "c", "d"), ids)
    }

    @Test
    fun `paging descending under a query neither skips nor duplicates`() {
        val store = store()
        seedMixed(store)

        val first = store.query(2, null, query = "standup")
        val second = store.query(2, first.last().timestamp, query = "standup")

        assertEquals(listOf("d", "c"), first.map { it.id })
        assertEquals(listOf("a"), second.map { it.id })
    }

    @Test
    fun `paging ascending under a query neither skips nor duplicates`() {
        val store = store()
        seedMixed(store)

        val first = store.query(2, null, query = "standup", ascending = true)
        val second = store.query(2, first.last().timestamp, query = "standup", ascending = true)

        assertEquals(listOf("a", "c"), first.map { it.id })
        assertEquals(listOf("d"), second.map { it.id })
    }

    @Test
    fun `a blank query does not filter`() {
        val store = store()
        seedMixed(store)

        assertEquals(4, store.query(10, null, query = "   ").size)
    }
}
