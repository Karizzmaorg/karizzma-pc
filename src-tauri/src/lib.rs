mod commands;
mod storage;

use commands::{library, reader, settings};
use tauri::Manager;

#[tauri::command]
fn show_main_window(window: tauri::Window) {
    let _ = window.show();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            library::get_library_titles,
            library::add_title_to_library,
            library::remove_title_from_library,
            library::import_local_files,
            library::get_categories,
            library::get_title_chapters,
            reader::get_chapter_pages,
            reader::update_reading_progress,
            settings::get_app_data_dir,
            show_main_window,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            // Initialize database on a background thread to avoid blocking window creation
            std::thread::spawn(move || {
                let db_path = app_handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data dir")
                    .join("karizzma.db");

                std::fs::create_dir_all(db_path.parent().unwrap()).ok();
                storage::database::initialize(&db_path)
                    .expect("Failed to initialize database");

                log::info!("Karizzma initialized. DB at: {:?}", db_path);
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Karizzma");
}
