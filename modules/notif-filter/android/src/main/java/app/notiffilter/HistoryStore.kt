package app.notiffilter

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

data class HistoryEntry(
    val id: String,
    val packageName: String,
    val appLabel: String,
    val title: String,
    val text: String,
    val disposition: String,  // "shown" or "blocked"
    val ruleId: String?,
    val ruleLabel: String?,
    val matchedSegment: String?,
    val timestamp: Long,
    val postTime: Long
)

class HistoryStore(context: Context) {

    private val dbHelper = HistoryDbHelper(context)

    /** Insert a new entry and auto-prune if over capacity. */
    fun insert(entry: HistoryEntry) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put("id", entry.id)
            put("package", entry.packageName)
            put("appLabel", entry.appLabel)
            put("title", entry.title.take(MAX_TITLE_LEN))
            put("text", entry.text.take(MAX_TEXT_LEN))
            put("disposition", entry.disposition)
            put("ruleId", entry.ruleId)
            put("ruleLabel", entry.ruleLabel)
            put("matchedSegment", entry.matchedSegment?.take(256))
            put("timestamp", entry.timestamp)
            put("postTime", entry.postTime)
        }
        db.insertWithOnConflict(TABLE, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        prune(db, MAX_ENTRIES)
    }

    /**
     * Paginated query. Returns entries newer than [beforeTs] (exclusive),
     * ordered by timestamp DESC (newest first), limited to [limit].
     */
    fun query(limit: Int, beforeTs: Long?): List<HistoryEntry> {
        val db = dbHelper.readableDatabase
        val selection = if (beforeTs != null) "timestamp < ?" else null
        val selectionArgs = if (beforeTs != null) arrayOf(beforeTs.toString()) else null

        val cursor: Cursor = db.query(
            TABLE, COLUMNS, selection, selectionArgs,
            null, null, "timestamp DESC", limit.toString()
        )
        return cursor.use { c ->
            val entries = mutableListOf<HistoryEntry>()
            while (c.moveToNext()) {
                entries.add(cursorToEntry(c))
            }
            entries
        }
    }

    /** Delete all entries. */
    fun deleteAll() {
        dbHelper.writableDatabase.delete(TABLE, null, null)
    }

    /** Get a single entry by id (for restore). Returns null if not found. */
    fun getById(id: String): HistoryEntry? {
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            TABLE, COLUMNS, "id = ?", arrayOf(id),
            null, null, null, "1"
        )
        return cursor.use { c ->
            if (c.moveToFirst()) cursorToEntry(c) else null
        }
    }

    fun size(): Int {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT COUNT(*) FROM $TABLE", null)
        return cursor.use { c ->
            if (c.moveToFirst()) c.getInt(0) else 0
        }
    }

    /** Serialize entries to JSON for the JS bridge. */
    fun entriesToJson(entries: List<HistoryEntry>): String {
        val arr = JSONArray()
        for (e in entries) {
            val obj = JSONObject()
            obj.put("id", e.id)
            obj.put("package", e.packageName)
            obj.put("appLabel", e.appLabel)
            obj.put("title", e.title)
            obj.put("text", e.text)
            obj.put("disposition", e.disposition)
            obj.put("ruleId", e.ruleId ?: JSONObject.NULL)
            obj.put("ruleLabel", e.ruleLabel ?: JSONObject.NULL)
            obj.put("matchedSegment", e.matchedSegment ?: JSONObject.NULL)
            obj.put("timestamp", e.timestamp)
            obj.put("postTime", e.postTime)
            arr.put(obj)
        }
        return arr.toString()
    }

    private fun cursorToEntry(c: Cursor): HistoryEntry {
        return HistoryEntry(
            id = c.getString(0),
            packageName = c.getString(1),
            appLabel = c.getString(2),
            title = c.getString(3),
            text = c.getString(4),
            disposition = c.getString(5),
            ruleId = if (c.isNull(6)) null else c.getString(6),
            ruleLabel = if (c.isNull(7)) null else c.getString(7),
            matchedSegment = if (c.isNull(8)) null else c.getString(8),
            timestamp = c.getLong(9),
            postTime = c.getLong(10)
        )
    }

    /** Delete oldest entries past [maxEntries]. */
    private fun prune(db: SQLiteDatabase, maxEntries: Int) {
        val cursor = db.rawQuery("SELECT COUNT(*) FROM $TABLE", null)
        val count = cursor.use { c ->
            if (c.moveToFirst()) c.getInt(0) else 0
        }
        if (count <= maxEntries) return
        val excess = count - maxEntries
        db.execSQL(
            "DELETE FROM $TABLE WHERE id IN " +
            "(SELECT id FROM $TABLE ORDER BY timestamp ASC LIMIT $excess)"
        )
    }

    companion object {
        private const val TABLE = "history"
        private const val MAX_ENTRIES = 500
        private const val MAX_TITLE_LEN = 256
        private const val MAX_TEXT_LEN = 1024

        val COLUMNS = arrayOf(
            "id", "package", "appLabel", "title", "text",
            "disposition", "ruleId", "ruleLabel", "matchedSegment",
            "timestamp", "postTime"
        )
    }
}

private class HistoryDbHelper(context: Context) :
    SQLiteOpenHelper(context, "notif_filter_history.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("PRAGMA journal_mode=WAL")
        db.execSQL("""
            CREATE TABLE history (
                id TEXT PRIMARY KEY,
                package TEXT NOT NULL,
                appLabel TEXT NOT NULL DEFAULT '',
                title TEXT NOT NULL DEFAULT '',
                text TEXT NOT NULL DEFAULT '',
                disposition TEXT NOT NULL,
                ruleId TEXT,
                ruleLabel TEXT,
                matchedSegment TEXT,
                timestamp INTEGER NOT NULL,
                postTime INTEGER NOT NULL
            )
        """.trimIndent())
        db.execSQL("CREATE INDEX idx_history_timestamp ON history(timestamp)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS history")
        onCreate(db)
    }
}
