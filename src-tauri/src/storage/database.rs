use rusqlite::{Connection, Result};
use std::path::Path;

const CURRENT_SCHEMA_VERSION: i32 = 2;

/// Initialize the database, creating tables and running migrations if needed.
pub fn initialize(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for better concurrent read/write performance
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    // Create schema version table
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        );",
    )?;

    let version: i32 = conn
        .query_row("SELECT COALESCE(MAX(version), 0) FROM schema_version", [], |row| {
            row.get(0)
        })
        .unwrap_or(0);

    if version < 1 {
        create_initial_schema(&conn)?;
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?1)",
            [CURRENT_SCHEMA_VERSION],
        )?;
    }

    if version < 2 {
        conn.execute_batch(
            "ALTER TABLE titles ADD COLUMN sort_order INTEGER DEFAULT 0;
             UPDATE schema_version SET version = 2;"
        )?;
    }

    Ok(())
}

fn create_initial_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        -- Titles (manga, novel, comic)
        CREATE TABLE IF NOT EXISTS titles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT,
            author TEXT,
            description TEXT,
            cover_url TEXT,
            cover_local_path TEXT,
            status TEXT DEFAULT 'unknown',
            content_type TEXT DEFAULT 'manga',
            genres TEXT DEFAULT '[]',
            in_library INTEGER DEFAULT 0,
            is_favorite INTEGER DEFAULT 0,
            date_added INTEGER,
            last_updated INTEGER,
            sort_order INTEGER DEFAULT 0,
            UNIQUE(source_id, url)
        );

        -- Chapters
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            name TEXT,
            chapter_number REAL DEFAULT 0,
            volume_number INTEGER,
            scanlator TEXT,
            date_upload INTEGER,
            is_read INTEGER DEFAULT 0,
            is_downloaded INTEGER DEFAULT 0,
            last_page_read INTEGER DEFAULT 0,
            date_read INTEGER,
            download_path TEXT,
            UNIQUE(title_id, url)
        );

        CREATE INDEX IF NOT EXISTS idx_chapters_title ON chapters(title_id);

        -- Reading History
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_id INTEGER NOT NULL REFERENCES titles(id),
            chapter_id INTEGER NOT NULL REFERENCES chapters(id),
            page_number INTEGER DEFAULT 0,
            time_spent_seconds INTEGER DEFAULT 0,
            timestamp INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_history_title ON history(title_id);
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);

        -- Categories
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS title_categories (
            title_id INTEGER REFERENCES titles(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
            PRIMARY KEY (title_id, category_id)
        );

        -- Tracker Data
        CREATE TABLE IF NOT EXISTS trackers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
            tracker_type TEXT NOT NULL,
            remote_id TEXT NOT NULL,
            status TEXT,
            score REAL,
            chapters_read INTEGER,
            last_synced INTEGER
        );

        -- Extensions
        CREATE TABLE IF NOT EXISTS extensions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            lang TEXT,
            type TEXT,
            nsfw INTEGER DEFAULT 0,
            enabled INTEGER DEFAULT 1,
            repo_url TEXT,
            installed_at INTEGER,
            updated_at INTEGER
        );

        -- Extension Repos
        CREATE TABLE IF NOT EXISTS extension_repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            enabled INTEGER DEFAULT 1,
            last_checked INTEGER
        );
        ",
    )?;

    Ok(())
}
