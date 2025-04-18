use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentTemplate {
    pub id: Uuid,
    pub name: String,
    pub content: String,
    pub document_type: String,
    pub variables: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Row> for DocumentTemplate {
    fn from(row: Row) -> Self {
        DocumentTemplate {
            id: Uuid::parse_str(&row.get::<String>("id").unwrap()).unwrap(),
            name: row.get("name").unwrap(),
            content: row.get("content").unwrap(),
            document_type: row.get("document_type").unwrap(),
            variables: serde_json::from_str(&row.get::<String>("variables").unwrap()).unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
} 