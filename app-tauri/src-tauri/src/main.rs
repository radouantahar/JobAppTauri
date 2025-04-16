#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use std::sync::Mutex;
use std::process::Command;
use std::path::Path;
use dotenv::dotenv;

mod commands;
mod models;
mod db;

use commands::*;
use db::init_db;

// Structure pour stocker l'état de l'application
struct AppState {
    python_path: Mutex<String>,
    app_path: Mutex<String>,
}

// Fonction pour exécuter une commande Python
#[tauri::command]
async fn run_python_command(
    state: State<'_, AppState>,
    script: &str,
    args: Vec<String>,
) -> Result<String, String> {
    let python_path = state.python_path.lock().unwrap();
    let app_path = state.app_path.lock().unwrap();

    let output = Command::new(&*python_path)
        .current_dir(&*app_path)
        .arg(script)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn init_app(
    state: State<'_, AppState>,
    python_path: String,
    app_path: String,
) -> Result<(), String> {
    if !Path::new(&python_path).exists() {
        return Err("Python path does not exist".to_string());
    }

    if !Path::new(&app_path).exists() {
        return Err("App path does not exist".to_string());
    }

    *state.python_path.lock().unwrap() = python_path;
    *state.app_path.lock().unwrap() = app_path;

    Ok(())
}

fn main() {
    dotenv().ok();

    // Initialiser la base de données
    if let Err(e) = init_db() {
        eprintln!("Failed to initialize database: {}", e);
        std::process::exit(1);
    }

    tauri::Builder::default()
        .manage(AppState {
            python_path: Mutex::new(String::new()),
            app_path: Mutex::new(String::new()),
        })
        .invoke_handler(tauri::generate_handler![
            run_python_command,
            init_app,
            get_user_profile,
            update_user_profile,
            get_kanban_columns,
            move_kanban_card,
            get_search_preferences,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 