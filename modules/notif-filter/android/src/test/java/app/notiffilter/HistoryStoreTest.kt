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
    fun `deriveId is stable for the same key and postTime`() {
        assertEquals(
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 500L),
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 500L)
        )
    }

    @Test
    fun `deriveId separates the same key at different postTimes`() {
        assertNotEquals(
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 500L),
            HistoryEntry.deriveId("0|com.gmail|1|tag|10123", 501L)
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
    fun `reinserting the same derived id replaces rather than duplicates`() {
        val store = store()
        val id = HistoryEntry.deriveId("0|com.gmail|1|null|1", 100L)

        store.insert(entry(id, 100L))
        store.insert(entry(id, 100L).copy(title = "Updated"))

        val entries = store.query(10, null)
        assertEquals(1, entries.size)
        assertEquals("Updated", entries[0].title)
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
}
