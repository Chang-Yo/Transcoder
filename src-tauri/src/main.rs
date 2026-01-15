// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod ffmpeg;
mod models;
mod preset;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::check_ffmpeg_available,
            commands::get_media_info,
            commands::start_transcode,
            commands::start_batch_transcode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
