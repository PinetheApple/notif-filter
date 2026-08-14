package app.notiffilter

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

data class HistoryEntry(
    val id: String,
    val packageName: String,
    val appLabel: String,
    val title: String,
    val text: String,
    val subText: String = "",
    val bigText: String = "",
    val summaryText: String = "",
    val infoText: String = "",
    val textLines: String = "",
    val disposition: String,  // "shown" or "blocked"
    val ruleId: String?,
    val ruleLabel: String?,
    val matchedSegment: String?,
    /** StatusBarNotification.key of the source notification, "" when unknown. */
    val notifKey: String = "",
    /** True when the row came from a reconnect backfill, not from a live post. */
    val recovered: Boolean = false,
    val timestamp: Long,
    val postTime: Long
) {
    companion object {
        /**
         * Row identity for a notification.
         *
         * A reconnect backfill re-reads notifications that may already be recorded, so
         * the id has to be a function of the notification rather than a fresh UUID.
         */
        fun deriveId(notifKey: String, postTime: Long): String =
            "${notifKey.take(MAX_KEY_LEN)}#$postTime"

        const val MAX_KEY_LEN = 256
    }
}

class HistoryStore(context: Context) {

    private val dbHelper = HistoryDbHelper(context)

    /** Insert a new entry and auto-prune past [maxEntries]. */
    fun insert(entry: HistoryEntry, maxEntries: Int = DEFAULT_MAX_ENTRIES) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put("id", entry.id)
            put("package", entry.packageName)
            put("appLabel", entry.appLabel)
            put("title", entry.title.take(MAX_TITLE_LEN))
            put("text", entry.text.take(MAX_TEXT_LEN))
            put("subText", entry.subText.take(MAX_SHORT_LEN))
            put("bigText", entry.bigText.take(MAX_BODY_LEN))
            put("summaryText", entry.summaryText.take(MAX_SHORT_LEN))
            put("infoText", entry.infoText.take(MAX_SHORT_LEN))
            put("textLines", entry.textLines.take(MAX_BODY_LEN))
            put("disposition", entry.disposition)
            put("ruleId", entry.ruleId)
            put("ruleLabel", entry.ruleLabel)
            put("matchedSegment", entry.matchedSegment?.take(MAX_SHORT_LEN))
            put("notifKey", entry.notifKey.take(HistoryEntry.MAX_KEY_LEN))
            put("recovered", if (entry.recovered) 1 else 0)
            put("timestamp", entry.timestamp)
            put("postTime", entry.postTime)
        }
        db.insertWithOnConflict(TABLE, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        // A non-positive limit means pruning is disabled for this insert.
        if (maxEntries > 0) prune(db, maxEntries)
    }

    /**
     * Paginated query. Returns entries older than [beforeTs] (exclusive),
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

    /**
     * True when a row for [id] is already recorded.
     * The reconnect backfill uses this to skip notifications history already has.
     */
    fun exists(id: String): Boolean {
        val db = dbHelper.readableDatabase
        val cursor = db.query(TABLE, arrayOf("id"), "id = ?", arrayOf(id), null, null, null, "1")
        return cursor.use { c -> c.moveToFirst() }
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
            obj.put("subText", e.subText)
            obj.put("bigText", e.bigText)
            obj.put("summaryText", e.summaryText)
            obj.put("infoText", e.infoText)
            obj.put("textLines", e.textLines)
            obj.put("disposition", e.disposition)
            obj.put("ruleId", e.ruleId ?: JSONObject.NULL)
            obj.put("ruleLabel", e.ruleLabel ?: JSONObject.NULL)
            obj.put("matchedSegment", e.matchedSegment ?: JSONObject.NULL)
            obj.put("notifKey", e.notifKey)
            obj.put("recovered", e.recovered)
            obj.put("timestamp", e.timestamp)
            obj.put("postTime", e.postTime)
            arr.put(obj)
        }
        return arr.toString()
    }

    // Read by column name, not ordinal: the projection has grown once already and
    // ordinal reads break silently when it grows again.
    private fun cursorToEntry(c: Cursor): HistoryEntry {
        return HistoryEntry(
            id = c.str("id"),
            packageName = c.str("package"),
            appLabel = c.str("appLabel"),
            title = c.str("title"),
            text = c.str("text"),
            subText = c.str("subText"),
            bigText = c.str("bigText"),
            summaryText = c.str("summaryText"),
            infoText = c.str("infoText"),
            textLines = c.str("textLines"),
            disposition = c.str("disposition"),
            ruleId = c.strOrNull("ruleId"),
            ruleLabel = c.strOrNull("ruleLabel"),
            matchedSegment = c.strOrNull("matchedSegment"),
            notifKey = c.str("notifKey"),
            recovered = c.getInt(c.getColumnIndexOrThrow("recovered")) != 0,
            timestamp = c.getLong(c.getColumnIndexOrThrow("timestamp")),
            postTime = c.getLong(c.getColumnIndexOrThrow("postTime"))
        )
    }

    private fun Cursor.str(name: String): String {
        val index = getColumnIndexOrThrow(name)
        return if (isNull(index)) "" else getString(index)
    }

    private fun Cursor.strOrNull(name: String): String? {
        val index = getColumnIndexOrThrow(name)
        return if (isNull(index)) null else getString(index)
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
        const val DEFAULT_MAX_ENTRIES = 500
        private const val MAX_TITLE_LEN = 256
        private const val MAX_TEXT_LEN = 1024
        private const val MAX_SHORT_LEN = 256

        /** bigText and textLines carry whole email bodies and chat threads. */
        private const val MAX_BODY_LEN = 4096

        val COLUMNS = arrayOf(
            "id", "package", "appLabel", "title", "text",
            "subText", "bigText", "summaryText", "infoText", "textLines",
            "disposition", "ruleId", "ruleLabel", "matchedSegment",
            "notifKey", "recovered", "timestamp", "postTime"
        )
    }
}

private class HistoryDbHelper(context: Context) :
    SQLiteOpenHelper(context, "notif_filter_history.db", null, DB_VERSION) {

    // WAL must be set here, not as a PRAGMA in onCreate: SQLiteOpenHelper runs
    // onCreate inside a transaction, and SQLite refuses the mode change there.
    init {
        setWriteAheadLoggingEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE history (
                id TEXT PRIMARY KEY,
                package TEXT NOT NULL,
                appLabel TEXT NOT NULL DEFAULT '',
                title TEXT NOT NULL DEFAULT '',
                text TEXT NOT NULL DEFAULT '',
                subText TEXT NOT NULL DEFAULT '',
                bigText TEXT NOT NULL DEFAULT '',
                summaryText TEXT NOT NULL DEFAULT '',
                infoText TEXT NOT NULL DEFAULT '',
                textLines TEXT NOT NULL DEFAULT '',
                disposition TEXT NOT NULL,
                ruleId TEXT,
                ruleLabel TEXT,
                matchedSegment TEXT,
                notifKey TEXT NOT NULL DEFAULT '',
                recovered INTEGER NOT NULL DEFAULT 0,
                timestamp INTEGER NOT NULL,
                postTime INTEGER NOT NULL
            )
        """.trimIndent())
        db.execSQL("CREATE INDEX idx_history_timestamp ON history(timestamp)")
    }

    // History is a disposable log, so a schema change drops it rather than migrating.
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS history")
        onCreate(db)
    }

    companion object {
        private const val DB_VERSION = 2
    }
}
