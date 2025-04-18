use crate::models::traits::DatabaseModel;
use crate::types::{DbPool, DbResult, DbRow};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tauri_plugin_sql::Row;
use sqlx::FromRow;

#[derive(Debug, FromRow)]
pub struct JobStats {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_applications: i32,
    pub applications_this_week: i32,
    pub applications_this_month: i32,
    pub interviews_scheduled: i32,
    pub offers_received: i32,
    pub rejections: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[async_trait::async_trait]
impl DatabaseModel for JobStats {
    fn table_name() -> &'static str {
        "job_stats"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            INSERT INTO job_stats (
                id, user_id, total_applications, applications_this_week,
                applications_this_month, interviews_scheduled, offers_received,
                rejections, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&model.id)
        .bind(&model.user_id)
        .bind(model.total_applications)
        .bind(model.applications_this_week)
        .bind(model.applications_this_month)
        .bind(model.interviews_scheduled)
        .bind(model.offers_received)
        .bind(model.rejections)
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
            SELECT * FROM job_stats WHERE id = ?
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
            UPDATE job_stats SET
                user_id = ?,
                total_applications = ?,
                applications_this_week = ?,
                applications_this_month = ?,
                interviews_scheduled = ?,
                offers_received = ?,
                rejections = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&model.user_id)
        .bind(model.total_applications)
        .bind(model.applications_this_week)
        .bind(model.applications_this_month)
        .bind(model.interviews_scheduled)
        .bind(model.offers_received)
        .bind(model.rejections)
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
            DELETE FROM job_stats WHERE id = ?
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
            total_applications: row.get("total_applications"),
            applications_this_week: row.get("applications_this_week"),
            applications_this_month: row.get("applications_this_month"),
            interviews_scheduled: row.get("interviews_scheduled"),
            offers_received: row.get("offers_received"),
            rejections: row.get("rejections"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

impl JobStats {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Option<Self>> {
        let row = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM job_stats WHERE user_id = ?
            "#,
        )
        .bind(Uuid::parse_str(user_id)?)
        .fetch_optional(pool)
        .await?;
        Ok(row)
    }
}

impl From<Row> for JobStats {
    fn from(row: Row) -> Self {
        JobStats {
            id: Uuid::parse_str(&row.get::<String>("id").unwrap()).unwrap(),
            user_id: Uuid::parse_str(&row.get::<String>("user_id").unwrap()).unwrap(),
            total_applications: row.get("total_applications").unwrap(),
            applications_this_week: row.get("applications_this_week").unwrap(),
            applications_this_month: row.get("applications_this_month").unwrap(),
            interviews_scheduled: row.get("interviews_scheduled").unwrap(),
            offers_received: row.get("offers_received").unwrap(),
            rejections: row.get("rejections").unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
} 