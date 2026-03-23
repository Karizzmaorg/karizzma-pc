use std::path::PathBuf;
use std::io::Read as IoRead;
use tauri::{AppHandle, Manager};

/// Get pages for a chapter. For local files, reads images from the archive/folder.
#[tauri::command]
pub async fn get_chapter_pages(
    app: AppHandle,
    chapter_id: i64,
) -> Result<Vec<String>, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let (url, download_path): (String, Option<String>) = conn
        .query_row(
            "SELECT url, download_path FROM chapters WHERE id = ?1",
            rusqlite::params![chapter_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    let local_path = download_path.as_deref().unwrap_or(&url);
    let path = PathBuf::from(local_path);

    if path.is_dir() {
        // Folder of images
        let mut pages: Vec<String> = Vec::new();
        let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let entry_path = entry.path();
            if is_image_file(&entry_path) {
                pages.push(entry_path.to_string_lossy().to_string());
            }
        }

        pages.sort_by(|a, b| natord::compare(a, b));
        Ok(pages)
    } else if path.exists() {
        // Archive file (CBZ, ZIP, etc.) — extract images to cache dir
        let cache_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("cache")
            .join("extracted")
            .join(format!("chapter_{}", chapter_id));

        // If already extracted, just read the directory
        if cache_dir.is_dir() {
            let mut pages: Vec<String> = Vec::new();
            let entries = std::fs::read_dir(&cache_dir).map_err(|e| e.to_string())?;
            for entry in entries {
                let entry = entry.map_err(|e| e.to_string())?;
                let entry_path = entry.path();
                if is_image_file(&entry_path) {
                    pages.push(entry_path.to_string_lossy().to_string());
                }
            }
            pages.sort_by(|a, b| natord::compare(a, b));
            return Ok(pages);
        }

        std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

        let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

        let mut pages: Vec<String> = Vec::new();

        for i in 0..archive.len() {
            let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
            if entry.is_dir() {
                continue;
            }

            let entry_name = entry.name().to_string();
            let entry_path = PathBuf::from(&entry_name);

            if !is_image_file(&entry_path) {
                continue;
            }

            // Use just the filename (strip any directory structure inside the archive)
            let file_name = entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let out_path = cache_dir.join(&file_name);

            let mut buf = Vec::new();
            entry.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            std::fs::write(&out_path, &buf).map_err(|e| e.to_string())?;

            pages.push(out_path.to_string_lossy().to_string());
        }

        pages.sort_by(|a, b| natord::compare(a, b));
        Ok(pages)
    } else {
        // Remote URL — return as-is for extension to handle
        Ok(vec![url])
    }
}

/// Update reading progress for a chapter
#[tauri::command]
pub async fn update_reading_progress(
    app: AppHandle,
    chapter_id: i64,
    page: i64,
    is_read: bool,
) -> Result<(), String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("karizzma.db");

    let conn =
        rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "UPDATE chapters SET last_page_read = ?1, is_read = ?2, date_read = ?3 WHERE id = ?4",
        rusqlite::params![page, is_read, now, chapter_id],
    )
    .map_err(|e| e.to_string())?;

    // Also insert into history
    let title_id: i64 = conn
        .query_row(
            "SELECT title_id FROM chapters WHERE id = ?1",
            rusqlite::params![chapter_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO history (title_id, chapter_id, page_number, timestamp)
         VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![title_id, chapter_id, page, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Batch convert multiple local file paths to base64 data URLs in a single IPC call
#[tauri::command]
pub async fn read_images_as_data_urls(paths: Vec<String>) -> Result<Vec<String>, String> {
    use base64::Engine;

    let results: Vec<String> = paths
        .into_iter()
        .map(|path| {
            let file_path = PathBuf::from(&path);
            if path.starts_with("http://") || path.starts_with("https://") || path.starts_with("data:") {
                return path;
            }
            let ext = file_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png")
                .to_lowercase();
            let mime = match ext.as_str() {
                "jpg" | "jpeg" => "image/jpeg",
                "png" => "image/png",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "bmp" => "image/bmp",
                "avif" => "image/avif",
                _ => "image/png",
            };
            match std::fs::read(&file_path) {
                Ok(buf) => {
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
                    format!("data:{};base64,{}", mime, b64)
                }
                Err(_) => String::new(),
            }
        })
        .collect();

    Ok(results)
}

/// Read a local file and return it as a base64 data URL
#[tauri::command]
pub async fn read_image_as_data_url(path: String) -> Result<String, String> {
    use std::io::Read as StdRead;
    let file_path = PathBuf::from(&path);
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "avif" => "image/avif",
        _ => "image/png",
    };

    let mut file = std::fs::File::open(&file_path).map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).map_err(|e| e.to_string())?;

    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
    Ok(format!("data:{};base64,{}", mime, b64))
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
