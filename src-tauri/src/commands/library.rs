use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use std::path::PathBuf;
use std::io::Read as IoRead;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TitleInfo {
    pub id: i64,
    pub source_id: String,
    pub url: String,
    pub title: String,
    pub artist: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub cover_url: Option<String>,
    pub cover_local_path: Option<String>,
    pub status: String,
    pub content_type: String,
    pub genres: Vec<String>,
    pub in_library: bool,
    pub is_favorite: bool,
    pub date_added: Option<i64>,
    pub last_updated: Option<i64>,
    pub unread_count: Option<i64>,
    pub sort_order: i64,
}

#[tauri::command]
pub async fn get_library_titles(app: AppHandle) -> Result<Vec<TitleInfo>, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, source_id, url, title, artist, author, description,
                    cover_url, cover_local_path, status, content_type, genres,
                    in_library, is_favorite, date_added, last_updated, sort_order
             FROM titles WHERE in_library = 1
             ORDER BY last_updated DESC",
        )
        .map_err(|e| e.to_string())?;

    let titles = stmt
        .query_map([], |row| {
            let genres_json: String = row.get(11)?;
            let genres: Vec<String> =
                serde_json::from_str(&genres_json).unwrap_or_default();

            Ok(TitleInfo {
                id: row.get(0)?,
                source_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                artist: row.get(4)?,
                author: row.get(5)?,
                description: row.get(6)?,
                cover_url: row.get(7)?,
                cover_local_path: row.get(8)?,
                status: row.get(9)?,
                content_type: row.get(10)?,
                genres,
                in_library: row.get(12)?,
                is_favorite: row.get(13)?,
                date_added: row.get(14)?,
                last_updated: row.get(15)?,
                unread_count: None, // TODO: compute from chapters table
                sort_order: row.get::<_, i64>(16).unwrap_or(0),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(titles)
}

#[tauri::command]
pub async fn add_title_to_library(app: AppHandle, title_id: i64) -> Result<(), String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE titles SET in_library = 1, date_added = ?1 WHERE id = ?2",
        rusqlite::params![chrono::Utc::now().timestamp(), title_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn remove_title_from_library(
    app: AppHandle,
    title_id: i64,
) -> Result<(), String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE titles SET in_library = 0 WHERE id = ?1",
        rusqlite::params![title_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub titles_added: usize,
    pub chapters_added: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn import_local_files(
    app: AppHandle,
    paths: Vec<String>,
) -> Result<ImportResult, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut result = ImportResult {
        titles_added: 0,
        chapters_added: 0,
        errors: Vec::new(),
    };

    for path_str in &paths {
        let path = PathBuf::from(path_str);
        if !path.exists() {
            result.errors.push(format!("Path not found: {}", path_str));
            continue;
        }

        // Normalize path to canonical form for consistent matching
        let canonical = path.canonicalize().unwrap_or_else(|_| path.clone());
        let path_str = canonical.to_string_lossy().to_string()
            // Remove UNC prefix that canonicalize adds on Windows
            .trim_start_matches(r"\\?\").to_string();
        let path = PathBuf::from(&path_str);

        let title_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();

        let is_supported = if path.is_dir() {
            true
        } else {
            matches!(
                path.extension().and_then(|e| e.to_str()),
                Some("cbz" | "cbr" | "zip" | "rar" | "7z" | "cb7" | "pdf" | "epub")
            )
        };

        if !is_supported {
            result
                .errors
                .push(format!("Unsupported format: {}", path_str));
            continue;
        }

        let content_type = if path
            .extension()
            .and_then(|e| e.to_str())
            .map_or(false, |e| e == "epub")
        {
            "novel"
        } else {
            "manga"
        };

        let now = chrono::Utc::now().timestamp();

        // Extract cover image from archive or folder
        let cover_path = extract_cover(&app, &path, &title_name);

        // Get next sort_order
        let max_sort: i64 = conn
            .query_row("SELECT COALESCE(MAX(sort_order), 0) FROM titles WHERE in_library = 1", [], |row| row.get(0))
            .unwrap_or(0);

        // Try to insert, or re-enable if previously removed
        let rows = conn.execute(
            "INSERT OR IGNORE INTO titles (source_id, url, title, content_type, status, genres, in_library, date_added, last_updated, cover_local_path, sort_order)
             VALUES ('local', ?1, ?2, ?3, 'unknown', '[]', 1, ?4, ?4, ?5, ?6)",
            rusqlite::params![path_str, title_name, content_type, now, cover_path, max_sort + 1],
        )
        .map_err(|e| e.to_string())?;

        // If insert was ignored (title exists), re-enable it in library
        if rows == 0 {
            let updated = conn.execute(
                "UPDATE titles SET in_library = 1, date_added = ?1, last_updated = ?1, cover_local_path = COALESCE(?2, cover_local_path) WHERE source_id = 'local' AND url = ?3",
                rusqlite::params![now, cover_path, path_str],
            )
            .map_err(|e| e.to_string())?;

            // If no rows updated (path mismatch), try matching by title name
            if updated == 0 {
                conn.execute(
                    "UPDATE titles SET in_library = 1, url = ?1, date_added = ?2, last_updated = ?2, cover_local_path = COALESCE(?3, cover_local_path) WHERE source_id = 'local' AND title = ?4 AND in_library = 0",
                    rusqlite::params![path_str, now, cover_path, title_name],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        let title_id: i64 = conn
            .query_row(
                "SELECT id FROM titles WHERE source_id = 'local' AND url = ?1",
                rusqlite::params![path_str],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        // Add as a single chapter pointing to the file/folder
        conn.execute(
            "INSERT OR IGNORE INTO chapters (title_id, url, name, chapter_number, download_path, is_downloaded)
             VALUES (?1, ?2, ?3, 1.0, ?2, 1)",
            rusqlite::params![title_id, path_str, title_name],
        )
        .map_err(|e| e.to_string())?;

        result.titles_added += 1;
        result.chapters_added += 1;
    }

    Ok(result)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterInfo {
    pub id: i64,
    pub title_id: i64,
    pub url: String,
    pub name: Option<String>,
    pub chapter_number: f64,
    pub volume_number: Option<f64>,
    pub scanlator: Option<String>,
    pub date_upload: Option<i64>,
    pub is_read: bool,
    pub is_downloaded: bool,
    pub last_page_read: i64,
    pub date_read: Option<i64>,
    pub download_path: Option<String>,
}

#[tauri::command]
pub async fn get_title_chapters(app: AppHandle, title_id: i64) -> Result<Vec<ChapterInfo>, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title_id, url, name, chapter_number, volume_number, scanlator,
                    date_upload, is_read, is_downloaded, last_page_read, date_read, download_path
             FROM chapters WHERE title_id = ?1
             ORDER BY chapter_number ASC",
        )
        .map_err(|e| e.to_string())?;

    let chapters = stmt
        .query_map(rusqlite::params![title_id], |row| {
            Ok(ChapterInfo {
                id: row.get(0)?,
                title_id: row.get(1)?,
                url: row.get(2)?,
                name: row.get(3)?,
                chapter_number: row.get(4)?,
                volume_number: row.get(5)?,
                scanlator: row.get(6)?,
                date_upload: row.get(7)?,
                is_read: row.get(8)?,
                is_downloaded: row.get(9)?,
                last_page_read: row.get::<_, i64>(10).unwrap_or(0),
                date_read: row.get(11)?,
                download_path: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(chapters)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryInfo {
    pub id: i64,
    pub name: String,
    pub sort_order: i64,
}

#[tauri::command]
pub async fn get_categories(app: AppHandle) -> Result<Vec<CategoryInfo>, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, sort_order FROM categories ORDER BY sort_order")
        .map_err(|e| e.to_string())?;

    let categories = stmt
        .query_map([], |row| {
            Ok(CategoryInfo {
                id: row.get(0)?,
                name: row.get(1)?,
                sort_order: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(categories)
}

#[tauri::command]
pub async fn update_title_order(app: AppHandle, title_ids: Vec<i64>) -> Result<(), String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    for (i, id) in title_ids.iter().enumerate() {
        conn.execute(
            "UPDATE titles SET sort_order = ?1 WHERE id = ?2",
            rusqlite::params![i as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn is_image_file(path: &PathBuf) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .as_deref(),
        Some("jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "avif")
    )
}

/// Extract the first image from an archive or folder to use as cover art
fn extract_cover(app: &AppHandle, path: &PathBuf, title_name: &str) -> Option<String> {
    let covers_dir = app
        .path()
        .app_data_dir()
        .ok()?
        .join("covers");
    std::fs::create_dir_all(&covers_dir).ok()?;

    if path.is_dir() {
        // Find first image in folder
        let mut images: Vec<PathBuf> = std::fs::read_dir(path)
            .ok()?
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| is_image_file(p))
            .collect();
        images.sort_by(|a, b| natord::compare(&a.to_string_lossy(), &b.to_string_lossy()));

        let first = images.first()?;
        let ext = first.extension()?.to_str()?;
        let cover_name = format!("{}.{}", sanitize_filename(title_name), ext);
        let dest = covers_dir.join(&cover_name);
        std::fs::copy(first, &dest).ok()?;
        Some(dest.to_string_lossy().to_string())
    } else {
        // Extract first image from archive
        let file = std::fs::File::open(path).ok()?;
        let mut archive = zip::ZipArchive::new(file).ok()?;

        // Collect image entries and sort them
        let mut image_entries: Vec<(usize, String)> = Vec::new();
        for i in 0..archive.len() {
            let entry = archive.by_index(i).ok()?;
            if entry.is_dir() {
                continue;
            }
            let name = entry.name().to_string();
            if is_image_file(&PathBuf::from(&name)) {
                image_entries.push((i, name));
            }
        }
        image_entries.sort_by(|a, b| natord::compare(&a.1, &b.1));

        let (idx, entry_name) = image_entries.first()?;
        let ext = PathBuf::from(entry_name)
            .extension()?
            .to_str()?
            .to_string();
        let cover_name = format!("{}.{}", sanitize_filename(title_name), ext);
        let dest = covers_dir.join(&cover_name);

        let mut entry = archive.by_index(*idx).ok()?;
        let mut buf = Vec::new();
        entry.read_to_end(&mut buf).ok()?;
        std::fs::write(&dest, &buf).ok()?;

        Some(dest.to_string_lossy().to_string())
    }
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' })
        .collect()
}
