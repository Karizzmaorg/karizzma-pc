use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(dir.to_string_lossy().to_string())
}
