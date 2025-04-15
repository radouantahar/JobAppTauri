use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use tauri::Config;

pub struct DatabaseConfig {
    pub connection: Connection,
}

impl DatabaseConfig {
    pub fn new(config: &Config) -> Result<Self> {
        let app_data_path = app_data_dir(config)
            .expect("Impossible de trouver le répertoire de données de l'application");
        
        // Créer le répertoire s'il n'existe pas
        std::fs::create_dir_all(&app_data_path)?;
        
        let db_path = app_data_path.join("database.sqlite");
        let connection = Connection::open(db_path)?;
        
        Ok(Self { connection })
    }

    pub fn init_tables(&self) -> Result<()> {
        // Table des utilisateurs
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Table des profils utilisateurs
        self.connection.execute(
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
            [],
        )?;

        // Table des offres d'emploi
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                description TEXT,
                requirements TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                salary_currency TEXT,
                salary_period TEXT,
                url TEXT,
                source TEXT,
                status TEXT DEFAULT 'new',
                matching_score REAL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            [],
        )?;

        // Table des temps de trajet
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS commute_times (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                home_type TEXT NOT NULL,
                duration INTEGER NOT NULL,
                distance REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )",
            [],
        )?;

        // Table des documents
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            [],
        )?;

        // Table des modèles de documents
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS document_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            [],
        )?;

        Ok(())
    }
} 