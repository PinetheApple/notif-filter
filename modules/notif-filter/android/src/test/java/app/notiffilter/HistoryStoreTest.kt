package app.notiffilter

import org.junit.Assert.assertEquals
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
}
