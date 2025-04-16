use rusqlite::{Connection, Result as SqlResult};
use std::path::PathBuf;
use std::env;

pub struct DbState {
    #[allow(dead_code)]
    pub conn: Connection,
}

pub fn init_db() -> SqlResult<DbState> {
    let db_path = get_db_path();
    
    // Créer le dossier data s'il n'existe pas
    if let Some(parent) = db_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            eprintln!("Failed to create data directory: {}", e);
            // On continue même si la création du dossier échoue
            // car le dossier pourrait déjà exister
        }
    }

    let conn = Connection::open(&db_path)?;

    // Appliquer les migrations
    conn.execute(
        include_str!("../migrations/001_initial.sql"),
        [],
    )?;

    Ok(DbState { conn })
}

#[allow(dead_code)]
pub fn get_db_connection() -> SqlResult<Connection> {
    let db_path = get_db_path();
    Connection::open(&db_path)
}

fn get_db_path() -> PathBuf {
    let mut path = env::current_dir().unwrap();
    path.push("data");
    path.push("jobs.db");
    path
} 