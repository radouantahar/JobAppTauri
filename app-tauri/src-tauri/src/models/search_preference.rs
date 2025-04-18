use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;
use crate::models::traits::DatabaseModel;
use crate::types::{DbPool, DbResult, DbRow};
use sqlx::FromRow;

#[derive(Debug, FromRow)]
pub struct SearchPreference {
    pub id: Uuid,
    pub user_id: Uuid,
    pub keywords: String,
    pub radius: i32,
    pub experience_level: String,
    pub remote_preference: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl DatabaseModel for SearchPreference {
    fn table_name() -> &'static str {
        "search_preferences"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            INSERT INTO search_preferences (
                id, user_id, keywords, radius, experience_level,
                remote_preference, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&model.id)
        .bind(&model.user_id)
        .bind(&model.keywords)
        .bind(model.radius)
        .bind(&model.experience_level)
        .bind(&model.remote_preference)
        .bind(model.created_at)
        .bind(model.updated_at)
        .execute(pool)
        .await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &str) -> DbResult<Option<Self>> {
        let uuid = Uuid::parse_str(id)?;
        let row = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM search_preferences WHERE id = ?
            "#,
        )
        .bind(uuid)
        .fetch_optional(pool)
        .await?;
        Ok(row)
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            UPDATE search_preferences SET
                user_id = ?,
                keywords = ?,
                radius = ?,
                experience_level = ?,
                remote_preference = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&model.user_id)
        .bind(&model.keywords)
        .bind(model.radius)
        .bind(&model.experience_level)
        .bind(&model.remote_preference)
        .bind(model.updated_at)
        .bind(&model.id)
        .execute(pool)
        .await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &str) -> DbResult<()> {
        let uuid = Uuid::parse_str(id)?;
        sqlx::query(
            r#"
            DELETE FROM search_preferences WHERE id = ?
            "#,
        )
        .bind(uuid)
        .execute(pool)
        .await?;
        Ok(())
    }

    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: row.get("id"),
            user_id: row.get("user_id"),
            keywords: row.get("keywords"),
            radius: row.get("radius"),
            experience_level: row.get("experience_level"),
            remote_preference: row.get("remote_preference"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

impl SearchPreference {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Option<Self>> {
        let uuid = Uuid::parse_str(user_id)?;
        let row = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM search_preferences WHERE user_id = ?
            "#,
        )
        .bind(uuid)
        .fetch_optional(pool)
        .await?;
        Ok(row)
    }
} 