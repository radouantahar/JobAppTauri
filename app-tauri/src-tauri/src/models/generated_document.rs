use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedDocument {
    pub id: Uuid,
    pub template_id: Uuid,
    pub content: String,
    pub variables: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Row> for GeneratedDocument {
    fn from(row: Row) -> Self {
        GeneratedDocument {
            id: Uuid::parse_str(&row.get::<String>("id").unwrap()).unwrap(),
            template_id: Uuid::parse_str(&row.get::<String>("template_id").unwrap()).unwrap(),
            content: row.get("content").unwrap(),
            variables: serde_json::from_str(&row.get::<String>("variables").unwrap()).unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
} 