#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowBuilder, WindowUrl};
use tauri_plugin_sql::{Migration, MigrationKind, SqlitePool};
use tauri_plugin_shell::ShellExt;
use std::sync::Mutex;
use std::path::PathBuf;
use std::process::Command;
use std::env;
use dotenv::dotenv;
use tokio::sync::Mutex as AsyncMutex;
use crate::database::backup::DatabaseBackup;
use std::sync::Arc;
use tauri::{Manager, State};
use tauri_plugin_sql::TauriSql;
use tokio::sync::Mutex;

mod commands;
mod db;
mod models;
mod types;

use commands::*;
use auth::{login, register, logout};
use db::get_migrations;

// Structure pour stocker l'état de l'application
struct AppState {
    pool: Mutex<SqlitePool>,
}

// Fonction pour exécuter une commande Python
fn run_python_command(script_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("python")
        .arg(script_path)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Fonction pour initialiser l'application
async fn init_app() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    // Initialiser le pool de connexions SQLite
    let pool = SqlitePool::new("sqlite:app.db").await?;

    // Exécuter les migrations
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add kanban and job stats tables",
            sql: include_str!("../migrations/0002_kanban_tables.sql"),
            kind: MigrationKind::Up,
        },
    ];

    for migration in migrations {
        pool.execute(migration.sql).await?;
    }

    Ok(pool)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();

    let pool = tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(init_app())
        .expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            pool: Mutex::new(pool),
        })
        .setup(|app| {
            // Créer la fenêtre principale
            let window = WindowBuilder::new(
                app,
                "main",
                WindowUrl::App("index.html".into())
            )
            .title("My Job Application App")
            .inner_size(1024.0, 768.0)
            .min_inner_size(800.0, 600.0)
            .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_python_command,
            get_user_profile,
            update_user_profile,
            get_kanban_columns,
            move_kanban_card,
            get_search_preferences,
            update_search_preferences,
            search_jobs,
            get_documents,
            create_document,
            update_document,
            delete_document,
            get_document_templates,
            login,
            register,
            logout,
            create_kanban_column,
            update_kanban_column,
            delete_kanban_column,
            create_kanban_card,
            get_kanban_cards,
            update_kanban_card,
            delete_kanban_card,
            update_job_stats,
            get_job_stats,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors du lancement de l'application");
}

#[tokio::main]
async fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle();
            let db = TauriSql::new("sqlite:app.db").await?;
            
            // Exécuter les migrations
            let migrations = get_migrations();
            for migration in migrations {
                db.pool.lock().await.execute(&migration.sql, &[])?;
            }
            
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            login,
            register,
            logout,
            
            // Applications
            get_application,
            create_application,
            update_application,
            delete_application,
            
            // Documents
            get_documents,
            create_document,
            update_document,
            delete_document,
            upload_document,
            get_document_templates,
            
            // Search
            search_jobs,
            get_job_details,
            get_search_preferences,
            update_search_preferences,
            
            // Kanban
            create_kanban_column,
            get_kanban_columns,
            update_kanban_column,
            delete_kanban_column,
            create_kanban_card,
            get_kanban_cards,
            update_kanban_card,
            delete_kanban_card,
            update_job_stats,
            get_job_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 