use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::types::{DbResult, DbPool, DbRow};
use crate::models::types::{Id, Identifiable, Timestamped, DatabaseModel, Owned};
use uuid::Uuid;

/// Représente une candidature dans le système
/// 
/// # Fields
/// * `id` - Identifiant unique de la candidature
/// * `user_id` - Identifiant de l'utilisateur qui a créé la candidature
/// * `job_id` - Identifiant de l'offre d'emploi associée
/// * `company_name` - Nom de la société associée à la candidature
/// * `position` - Poste associé à la candidature
/// * `status` - Statut de la candidature (ex: "En cours", "Acceptée", "Refusée")
/// * `application_date` - Date de candidature
/// * `notes` - Notes personnelles sur la candidature
/// * `cv_path` - Chemin vers le CV utilisé pour cette candidature
/// * `created_at` - Date de création de la candidature
/// * `updated_at` - Date de dernière mise à jour
#[derive(Debug, Serialize, Deserialize)]
pub struct Application {
    pub id: Id,
    pub user_id: Id,
    pub job_id: Id,
    pub company_name: String,
    pub position: String,
    pub application_date: DateTime<Utc>,
    pub status: String,
    pub notes: Option<String>,
    pub cv_path: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Identifiable for Application {
    fn id(&self) -> &Id {
        &self.id
    }
}

impl Timestamped for Application {
    fn created_at(&self) -> &DateTime<Utc> {
        &self.created_at
    }

    fn updated_at(&self) -> &DateTime<Utc> {
        &self.updated_at
    }
}

impl Owned for Application {
    fn user_id(&self) -> &Id {
        &self.user_id
    }
}

impl DatabaseModel for Application {
    fn table_name() -> &'static str {
        "applications"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            INSERT INTO applications (
                id, user_id, job_id, company_name, position,
                application_date, status, notes, cv_path, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &model.id.to_string(),
                &model.user_id.to_string(),
                &model.job_id.to_string(),
                &model.company_name,
                &model.position,
                &model.application_date.to_rfc3339(),
                &model.status,
                &model.notes,
                &model.cv_path,
                &model.created_at.to_rfc3339(),
                &model.updated_at.to_rfc3339(),
            ],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &Id) -> DbResult<Option<Self>> {
        let row = pool
            .fetch_one(
                r#"
                SELECT * FROM applications WHERE id = ?
                "#,
                &[&id.to_string()],
            )
            .await?;
        Ok(Some(Self::from_row(row)?))
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            UPDATE applications SET
                user_id = ?,
                job_id = ?,
                company_name = ?,
                position = ?,
                application_date = ?,
                status = ?,
                notes = ?,
                cv_path = ?,
                updated_at = ?
            WHERE id = ?
            "#,
            &[
                &model.user_id.to_string(),
                &model.job_id.to_string(),
                &model.company_name,
                &model.position,
                &model.application_date.to_rfc3339(),
                &model.status,
                &model.notes,
                &model.cv_path,
                &model.updated_at.to_rfc3339(),
                &model.id.to_string(),
            ],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &Id) -> DbResult<()> {
        let mut tx = pool.begin().await?;
        
        tx.execute(
            r#"
            DELETE FROM applications WHERE id = ?
            "#,
            &[&id.to_string()],
        )
        .await?;

        tx.commit().await?;
        Ok(())
    }

    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: Uuid::parse_str(&row.get::<String>("id")?)?,
            user_id: Uuid::parse_str(&row.get::<String>("user_id")?)?,
            job_id: Uuid::parse_str(&row.get::<String>("job_id")?)?,
            company_name: row.get("company_name")?,
            position: row.get("position")?,
            application_date: DateTime::parse_from_rfc3339(&row.get::<String>("application_date")?)?.with_timezone(&Utc),
            status: row.get("status")?,
            notes: row.get("notes")?,
            cv_path: row.get("cv_path")?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<String>("created_at")?)?.with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<String>("updated_at")?)?.with_timezone(&Utc),
        })
    }
}

impl Application {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &Id) -> DbResult<Vec<Self>> {
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC
                "#,
                &[&user_id.to_string()],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }

    pub async fn find_by_job_id(pool: &DbPool, job_id: &Id) -> DbResult<Vec<Self>> {
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM applications WHERE job_id = ? ORDER BY created_at DESC
                "#,
                &[&job_id.to_string()],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }

    pub async fn search(pool: &DbPool, user_id: &Id, query: &str) -> DbResult<Vec<Self>> {
        let query_pattern = format!("%{}%", query);
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM applications 
                WHERE user_id = ? 
                AND (company_name LIKE ? OR position LIKE ? OR status LIKE ?)
                ORDER BY created_at DESC
                "#,
                &[
                    &user_id.to_string(),
                    &query_pattern,
                    &query_pattern,
                    &query_pattern,
                ],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }
} 