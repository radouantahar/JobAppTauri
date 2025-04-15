#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{command, State};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::Path;
use rusqlite::Connection;
use dotenv::dotenv;

mod commands;
mod models;

use commands::*;

#[derive(Debug, Serialize, Deserialize)]
struct UserProfile {
    id: i64,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    primary_home: String,
    secondary_home: String,
    cv_path: Option<String>,
    cv_last_updated: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct JobStats {
    total_applications: i64,
    interviews_scheduled: i64,
    offers_received: i64,
    avg_matching_score: f64,
}

fn get_db_connection() -> Result<Connection, String> {
    let db_path = std::env::var("DB_PATH").map_err(|_| "DB_PATH not set in .env".to_string())?;
    Connection::open(&db_path)
        .map_err(|e| format!("Failed to connect to database: {}", e))
}

// Structure pour stocker l'état de l'application
struct AppState {
    python_path: Mutex<String>,
    app_path: Mutex<String>,
    db_connection: Mutex<Connection>,
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

#[tauri::command]
fn get_user_profile() -> Result<UserProfile, String> {
    let conn = get_db_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, email, phone, primary_home, secondary_home, cv_path, cv_last_updated 
        FROM user_profile LIMIT 1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let profile = stmt.query_row([], |row| {
        Ok(UserProfile {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            phone: row.get(3)?,
            primary_home: row.get(4)?,
            secondary_home: row.get(5)?,
            cv_path: row.get(6)?,
            cv_last_updated: row.get(7)?,
        })
    }).optional()
    .map_err(|e| format!("Database error: {}", e))?
    .ok_or_else(|| "No user profile found".to_string())?;

    Ok(profile)
}

#[tauri::command]
fn update_user_profile(profile: UserProfile) -> Result<(), String> {
    let conn = get_db_connection()?;

    conn.execute(
        "UPDATE user_profile SET 
        name = ?1, 
        email = ?2, 
        phone = ?3, 
        primary_home = ?4, 
        secondary_home = ?5, 
        cv_path = ?6, 
        cv_last_updated = CURRENT_TIMESTAMP 
        WHERE id = ?7",
        params![
            profile.name,
            profile.email,
            profile.phone,
            profile.primary_home,
            profile.secondary_home,
            profile.cv_path,
            profile.id
        ],
    ).map_err(|e| format!("Failed to update profile: {}", e))?;

    Ok(())
}


#[tauri::command]
fn get_llm_providers() -> Result<Vec<LLMProvider>, String> {
    // Return a list of available LLM providers
    Ok(vec![
        LLMProvider { id: "ollama".to_string(), name: "Ollama".to_string() },
        LLMProvider { id: "openai".to_string(), name: "OpenAI".to_string() },
    ])
}

#[tauri::command]
fn get_job_stats() -> Result<JobStats, String> {
    let conn = get_db_connection()?;
    
    let mut stats = JobStats::default();
    
    // Total applications
    stats.total_applications = conn.query_row(
        "SELECT COUNT(*) FROM kanban_cards",
        [],
        |row| row.get(0)
    ).map_err(|e| format!("Failed to get total applications: {}", e))?;

    // Interviews scheduled
    stats.interviews_scheduled = conn.query_row(
        "SELECT COUNT(*) FROM kanban_cards 
        WHERE column_id = (SELECT id FROM kanban_columns WHERE name = 'Interview')",
        [],
        |row| row.get(0)
    ).map_err(|e| format!("Failed to get interviews count: {}", e))?;

    // Offers received
    stats.offers_received = conn.query_row(
        "SELECT COUNT(*) FROM kanban_cards 
        WHERE column_id = (SELECT id FROM kanban_columns WHERE name = 'Offer')",
        [],
        |row| row.get(0)
    ).map_err(|e| format!("Failed to get offers count: {}", e))?;

    // Average matching score
    stats.avg_matching_score = conn.query_row(
        "SELECT AVG(matching_score) FROM jobs",
        [],
        |row| row.get(0)
    ).map_err(|e| format!("Failed to get average score: {}", e))?;

    Ok(stats)
}

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
    dotenv().ok();

    // Initialiser la connexion à la base de données
    let db_path = std::env::var("DB_PATH").expect("DB_PATH must be set");
    let conn = Connection::open(&db_path).expect("Failed to connect to database");

    tauri::Builder::default()
        .manage(AppState {
            python_path: Mutex::new(String::from("python3")),
            app_path: Mutex::new(String::from(".")),
            db_connection: Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            search_jobs,
            get_user_profile,
            update_user_profile,
            get_kanban_columns,
            move_kanban_card,
            get_search_preferences,
            update_search_preferences,
            get_llm_providers,
            update_llm_provider,
            generate_search_suggestions,
            get_document_templates,
            generate_document,
            get_job_stats,
            get_application_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
