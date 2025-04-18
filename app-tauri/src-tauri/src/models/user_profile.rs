use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::models::types::{PhoneNumber, DocumentType};
use tauri_plugin_sql::{SqlitePool, Row};
use crate::models::traits::DatabaseModel;
use crate::types::{DbPool, DbResult, DbRow};
use uuid::Uuid;
use sqlx::FromRow;

/// Représente le profil d'un utilisateur
/// 
/// # Fields
/// * `id` - Identifiant unique du profil (INTEGER)
/// * `user_id` - Identifiant de l'utilisateur associé
/// * `full_name` - Nom complet de l'utilisateur (optionnel)
/// * `current_position` - Poste actuel (optionnel)
/// * `summary` - Résumé professionnel (optionnel)
/// * `skills` - Compétences au format JSON
/// * `experiences` - Expériences professionnelles au format JSON
/// * `education` - Formation au format JSON
/// * `languages` - Langues parlées au format JSON
#[derive(Debug, FromRow)]
pub struct UserProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub full_name: String,
    pub current_position: String,
    pub summary: String,
    pub location: Option<String>,
    pub website: Option<String>,
    pub linkedin_url: Option<String>,
    pub github_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Structure pour la création d'un nouveau profil utilisateur
/// 
/// # Fields
/// * `user_id` - Identifiant de l'utilisateur associé
/// * `full_name` - Nom complet de l'utilisateur (optionnel)
/// * `current_position` - Poste actuel (optionnel)
/// * `summary` - Résumé professionnel (optionnel)
/// * `skills` - Compétences au format JSON
/// * `experiences` - Expériences professionnelles au format JSON
/// * `education` - Formation au format JSON
/// * `languages` - Langues parlées au format JSON
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUserProfile {
    pub user_id: i64,
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: Value,
    pub experiences: Value,
    pub education: Value,
    pub languages: Value,
}

/// Structure pour la mise à jour d'un profil utilisateur
/// 
/// # Fields
/// * `full_name` - Nouveau nom complet (optionnel)
/// * `current_position` - Nouveau poste actuel (optionnel)
/// * `summary` - Nouveau résumé professionnel (optionnel)
/// * `skills` - Nouvelles compétences au format JSON (optionnel)
/// * `experiences` - Nouvelles expériences au format JSON (optionnel)
/// * `education` - Nouvelle formation au format JSON (optionnel)
/// * `languages` - Nouvelles langues au format JSON (optionnel)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserProfile {
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: Option<Value>,
    pub experiences: Option<Value>,
    pub education: Option<Value>,
    pub languages: Option<Value>,
}

impl DatabaseModel for UserProfile {
    fn table_name() -> &'static str {
        "user_profiles"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        sqlx::query(
            r#"
            INSERT INTO user_profiles (
                id, user_id, full_name, current_position, summary,
                location, website, linkedin_url, github_url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&model.id)
        .bind(&model.user_id)
        .bind(&model.full_name)
        .bind(&model.current_position)
        .bind(&model.summary)
        .bind(&model.location)
        .bind(&model.website)
        .bind(&model.linkedin_url)
        .bind(&model.github_url)
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
            SELECT * FROM user_profiles WHERE id = ?
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
            UPDATE user_profiles SET
                user_id = ?,
                full_name = ?,
                current_position = ?,
                summary = ?,
                location = ?,
                website = ?,
                linkedin_url = ?,
                github_url = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&model.user_id)
        .bind(&model.full_name)
        .bind(&model.current_position)
        .bind(&model.summary)
        .bind(&model.location)
        .bind(&model.website)
        .bind(&model.linkedin_url)
        .bind(&model.github_url)
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
            DELETE FROM user_profiles WHERE id = ?
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
            full_name: row.get("full_name"),
            current_position: row.get("current_position"),
            summary: row.get("summary"),
            location: row.get("location"),
            website: row.get("website"),
            linkedin_url: row.get("linkedin_url"),
            github_url: row.get("github_url"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

impl UserProfile {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Option<Self>> {
        let uuid = Uuid::parse_str(user_id)?;
        let row = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM user_profiles WHERE user_id = ?
            "#,
        )
        .bind(uuid)
        .fetch_optional(pool)
        .await?;
        Ok(row)
    }
} 