use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMProvider {
    pub id: Uuid,
    pub name: String,
    pub api_key: String,
    pub model: String,
    pub max_tokens: i32,
    pub temperature: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Row> for LLMProvider {
    fn from(row: Row) -> Self {
        LLMProvider {
            id: Uuid::parse_str(&row.get::<String>("id").unwrap()).unwrap(),
            name: row.get("name").unwrap(),
            api_key: row.get("api_key").unwrap(),
            model: row.get("model").unwrap(),
            max_tokens: row.get("max_tokens").unwrap(),
            temperature: row.get("temperature").unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
} 