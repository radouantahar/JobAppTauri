use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::types::{DbResult, DbPool, DbRow};
use crate::models::traits::DatabaseModel;
use uuid::Uuid;
use tauri_plugin_sql::Row;
use sqlx::FromRow;

/// Représente une colonne dans le tableau kanban
#[derive(Debug, FromRow)]
pub struct KanbanColumn {
    pub id: Uuid,
    pub name: String,
    pub order: i32,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl DatabaseModel for KanbanColumn {
    fn table_name() -> &'static str {
        "kanban_columns"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            INSERT INTO kanban_columns (
                id, name, order, user_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&model.id)
        .bind(&model.name)
        .bind(model.order)
        .bind(&model.user_id)
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
            SELECT * FROM kanban_columns WHERE id = ?
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
            UPDATE kanban_columns SET
                name = ?,
                order = ?,
                user_id = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&model.name)
        .bind(model.order)
        .bind(&model.user_id)
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
            DELETE FROM kanban_columns WHERE id = ?
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
            name: row.get("name"),
            order: row.get("order"),
            user_id: row.get("user_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

impl KanbanColumn {
    /// Recherche toutes les colonnes d'un utilisateur
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Vec<Self>> {
        let rows = pool.lock().await.query(
            r#"
            SELECT * FROM kanban_columns
            WHERE user_id = ?
            ORDER BY "order" ASC
            "#,
            &[&user_id],
        )?;

        let mut columns = Vec::new();
        for row in rows {
            columns.push(Self::from_row(row)?);
        }
        Ok(columns)
    }
}

/// Représente une carte dans le tableau kanban
#[derive(Debug, FromRow)]
pub struct KanbanCard {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub order: i32,
    pub column_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl DatabaseModel for KanbanCard {
    fn table_name() -> &'static str {
        "kanban_cards"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            INSERT INTO kanban_cards (
                id, title, description, order, column_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&model.id)
        .bind(&model.title)
        .bind(&model.description)
        .bind(model.order)
        .bind(&model.column_id)
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
            SELECT * FROM kanban_cards WHERE id = ?
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
            UPDATE kanban_cards SET
                title = ?,
                description = ?,
                order = ?,
                column_id = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&model.title)
        .bind(&model.description)
        .bind(model.order)
        .bind(&model.column_id)
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
            DELETE FROM kanban_cards WHERE id = ?
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
            title: row.get("title"),
            description: row.get("description"),
            order: row.get("order"),
            column_id: row.get("column_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

impl KanbanCard {
    /// Recherche toutes les cartes d'une colonne
    pub async fn find_by_column_id(pool: &DbPool, column_id: &str) -> DbResult<Vec<Self>> {
        let rows = pool.lock().await.query(
            r#"
            SELECT * FROM kanban_cards
            WHERE column_id = ?
            ORDER BY "order" ASC
            "#,
            &[&column_id],
        )?;

        let mut cards = Vec::new();
        for row in rows {
            cards.push(Self::from_row(row)?);
        }
        Ok(cards)
    }
}

/// Représente les statistiques de recherche d'emploi d'un utilisateur
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobStats {
    pub id: String,
    pub user_id: String,
    pub total_applications: i32,
    pub applications_this_week: i32,
    pub applications_this_month: i32,
    pub interviews_scheduled: i32,
    pub offers_received: i32,
    pub rejections: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl DatabaseModel for JobStats {
    fn table_name() -> &'static str {
        "job_stats"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            INSERT INTO job_stats (id, user_id, total_applications, applications_this_week, 
                                 applications_this_month, interviews_scheduled, offers_received, 
                                 rejections, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &model.id,
                &model.user_id,
                &model.total_applications,
                &model.applications_this_week,
                &model.applications_this_month,
                &model.interviews_scheduled,
                &model.offers_received,
                &model.rejections,
                &model.created_at,
                &model.updated_at,
            ],
        ).await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &str) -> DbResult<Option<Self>> {
        let mut rows = pool.query(
            "SELECT * FROM job_stats WHERE id = ?",
            &[&id],
        ).await?;

        if let Some(row) = rows.next()? {
            Ok(Some(Self {
                id: row.get("id")?,
                user_id: row.get("user_id")?,
                total_applications: row.get("total_applications")?,
                applications_this_week: row.get("applications_this_week")?,
                applications_this_month: row.get("applications_this_month")?,
                interviews_scheduled: row.get("interviews_scheduled")?,
                offers_received: row.get("offers_received")?,
                rejections: row.get("rejections")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            }))
        } else {
            Ok(None)
        }
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            UPDATE job_stats 
            SET total_applications = ?, applications_this_week = ?, applications_this_month = ?,
                interviews_scheduled = ?, offers_received = ?, rejections = ?, updated_at = ?
            WHERE id = ?
            "#,
            &[
                &model.total_applications,
                &model.applications_this_week,
                &model.applications_this_month,
                &model.interviews_scheduled,
                &model.offers_received,
                &model.rejections,
                &model.updated_at,
                &model.id,
            ],
        ).await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &str) -> DbResult<()> {
        pool.execute(
            "DELETE FROM job_stats WHERE id = ?",
            &[&id],
        ).await?;
        Ok(())
    }
}

impl JobStats {
    /// Recherche les statistiques d'un utilisateur
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Option<Self>> {
        let mut rows = pool.query(
            "SELECT * FROM job_stats WHERE user_id = ?",
            &[&user_id],
        ).await?;

        if let Some(row) = rows.next()? {
            Ok(Some(Self {
                id: row.get("id")?,
                user_id: row.get("user_id")?,
                total_applications: row.get("total_applications")?,
                applications_this_week: row.get("applications_this_week")?,
                applications_this_month: row.get("applications_this_month")?,
                interviews_scheduled: row.get("interviews_scheduled")?,
                offers_received: row.get("offers_received")?,
                rejections: row.get("rejections")?,
                created_at: row.get("created_at")?,
                updated_at: row.get("updated_at")?,
            }))
        } else {
            Ok(None)
        }
    }
} 