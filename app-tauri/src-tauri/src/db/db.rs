use std::fs;
use std::path::PathBuf;
use tauri::api::path;
use tauri_plugin_sql::{Migration, MigrationKind, SqlitePool};

pub async fn initialize_database() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = path::app_dir(&Default::default()).unwrap();
    fs::create_dir_all(&app_dir)?;
    
    let db_path = app_dir.join("job_applications.db");
    let database_url = format!("sqlite:{}", db_path.display());
    
    let pool = SqlitePool::connect(&database_url).await?;
    
    // Load and execute schema
    let schema = include_str!("schema.sql");
    pool.execute(schema).await?;
    
    Ok(pool)
}

pub async fn get_database_connection() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = path::app_dir(&Default::default()).unwrap();
    let db_path = app_dir.join("job_applications.db");
    let database_url = format!("sqlite:{}", db_path.display());
    
    SqlitePool::connect(&database_url).await.map_err(|e| e.into())
}

pub async fn backup_database() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_dir = path::app_dir(&Default::default()).unwrap();
    let db_path = app_dir.join("job_applications.db");
    let backup_path = app_dir.join("job_applications.backup.db");
    
    fs::copy(&db_path, &backup_path)?;
    
    Ok(backup_path)
} 