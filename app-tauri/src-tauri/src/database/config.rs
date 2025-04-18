use tauri_plugin_sql::{SqlitePool, Result};
use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use tauri::Config;

pub struct DatabaseConfig {
    pub pool: SqlitePool,
}

impl DatabaseConfig {
    pub fn new(config: &Config) -> Result<Self> {
        let app_data_path = app_data_dir(config)
            .expect("Impossible de trouver le répertoire de données de l'application");
        
        // Créer le répertoire s'il n'existe pas
        std::fs::create_dir_all(&app_data_path)?;
        
        let db_path = app_data_path.join("database.sqlite");
        let pool = SqlitePool::new(&db_path.to_string_lossy())?;
        
        Ok(Self { pool })
    }

    pub fn init_tables(&self) -> Result<()> {
        // Table des utilisateurs
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            &[],
        )?;

        // Table des profils utilisateurs
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                phone TEXT,
                address TEXT,
                city TEXT,
                postal_code TEXT,
                country TEXT,
                resume_path TEXT,
                cover_letter_template TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            &[],
        )?;

        // Table des documents
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            &[],
        )?;

        // Table des emplois
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                description TEXT,
                url TEXT,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            &[],
        )?;

        // Table des candidatures
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                applied_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )",
            &[],
        )?;

        Ok(())
    }
} 