use serde::{Deserialize, Serialize};
use crate::types::{DbPool, DbResult, DbRow, TauriSql};
use crate::models::traits::{DatabaseModel, FromRow};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Company {
    pub id: Uuid,
    pub name: String,
    pub website: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl FromRow for Company {
    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: row.get("id")?,
            name: row.get("name")?,
            website: row.get("website")?,
            description: row.get("description")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    }
} 