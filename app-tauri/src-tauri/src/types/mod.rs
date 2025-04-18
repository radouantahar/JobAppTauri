use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Types de base
pub type DbResult<T> = Result<T, anyhow::Error>;
pub type DbPool = tauri_plugin_sql::SqlitePool;
pub type DbRow = tauri_plugin_sql::Row;

// Types communs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timestamps {
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserId {
    pub id: Uuid,
}

// Ré-exports des types de tauri_plugin_sql
pub use tauri_plugin_sql::{Migration, MigrationKind, SqlitePool, Row};
pub type TauriSql = tauri_plugin_sql::Builder; 