use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationStats {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_applications: i64,
    pub total_interviews: i64,
    pub total_offers: i64,
    pub success_rate: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Row> for ApplicationStats {
    fn from(row: Row) -> Self {
        ApplicationStats {
            id: Uuid::parse_str(&row.get::<String>("id").unwrap()).unwrap(),
            user_id: Uuid::parse_str(&row.get::<String>("user_id").unwrap()).unwrap(),
            total_applications: row.get("total_applications").unwrap(),
            total_interviews: row.get("total_interviews").unwrap(),
            total_offers: row.get("total_offers").unwrap(),
            success_rate: row.get("success_rate").unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
} 