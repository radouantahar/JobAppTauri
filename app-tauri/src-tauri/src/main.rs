#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{command, State};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::Path;

// Structure pour stocker l'état de l'application
struct AppState {
    python_path: Mutex<String>,
    app_path: Mutex<String>,
}

// Fonction pour exécuter une commande Python
fn run_python_command(python_path: &str, app_path: &str, script: &str, args: Vec<&str>) -> Result<String, String> {
    let script_path = format!("{}/{}", app_path, script);
    
    let output = Command::new(python_path)
        .arg(&script_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Erreur lors de l'exécution de la commande Python: {}", e))?;
    
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Erreur dans le script Python: {}", stderr))
    }
}

// Commande pour initialiser l'application
#[command]
fn init_app(state: State<AppState>, python_path: String, app_path: String) -> Result<String, String> {
    *state.python_path.lock().unwrap() = python_path.clone();
    *state.app_path.lock().unwrap() = app_path.clone();
    
    // Vérifier que les chemins sont valides
    if !Path::new(&python_path).exists() {
        return Err(format!("Chemin Python invalide: {}", python_path));
    }
    
    if !Path::new(&app_path).exists() {
        return Err(format!("Chemin de l'application invalide: {}", app_path));
    }
    
    Ok("Application initialisée avec succès".to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            python_path: Mutex::new(String::from("python3")),
            app_path: Mutex::new(String::from(".")),
        })
        .invoke_handler(tauri::generate_handler![
            init_app,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Tauri");
}
