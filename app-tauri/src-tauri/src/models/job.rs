use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::types::{DbPool, DbResult, DbRow};
use crate::models::types::{Id, Identifiable, Timestamped, DatabaseModel, Owned};
use uuid::Uuid;

/// Représente une offre d'emploi dans le système
/// 
/// # Fields
/// * `id` - Identifiant unique de l'offre
/// * `user_id` - Identifiant unique de l'utilisateur
/// * `title` - Titre de l'offre
/// * `company` - Nom de l'entreprise
/// * `location` - Localisation du poste
/// * `job_type` - Type de contrat (CDI, CDD, etc.)
/// * `salary_min` - Salaire minimum (optionnel)
/// * `salary_max` - Salaire maximum (optionnel)
/// * `salary_currency` - Devise du salaire (optionnel)
/// * `salary_period` - Période du salaire (optionnel)
/// * `description` - Description détaillée du poste
/// * `url` - URL de l'offre
/// * `posted_at` - Date de publication de l'offre
/// * `experience_level` - Niveau d'expérience requis
/// * `skills` - Liste des compétences requises
/// * `remote` - Indique si le poste est en télétravail
/// * `source` - Source de l'offre (LinkedIn, Indeed, etc.)
/// * `created_at` - Date de création dans le système
/// * `updated_at` - Date de dernière mise à jour
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: Id,
    pub user_id: Id,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_type: String,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub salary_currency: Option<String>,
    pub salary_period: Option<String>,
    pub description: String,
    pub url: String,
    pub posted_at: DateTime<Utc>,
    pub experience_level: String,
    pub skills: Vec<String>,
    pub remote: bool,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Identifiable for Job {
    fn id(&self) -> &Id {
        &self.id
    }
}

impl Timestamped for Job {
    fn created_at(&self) -> &DateTime<Utc> {
        &self.created_at
    }

    fn updated_at(&self) -> &DateTime<Utc> {
        &self.updated_at
    }
}

impl Owned for Job {
    fn user_id(&self) -> &Id {
        &self.user_id
    }
}

impl DatabaseModel for Job {
    fn table_name() -> &'static str {
        "jobs"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            INSERT INTO jobs (
                id, user_id, title, company, location, job_type,
                salary_min, salary_max, salary_currency, salary_period,
                description, url, posted_at, experience_level, skills,
                remote, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &model.id.to_string(),
                &model.user_id.to_string(),
                &model.title,
                &model.company,
                &model.location,
                &model.job_type,
                &model.salary_min,
                &model.salary_max,
                &model.salary_currency,
                &model.salary_period,
                &model.description,
                &model.url,
                &model.posted_at.to_rfc3339(),
                &model.experience_level,
                &serde_json::to_string(&model.skills)?,
                &model.remote,
                &model.source,
                &model.created_at.to_rfc3339(),
                &model.updated_at.to_rfc3339(),
            ],
        )
        .await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &Id) -> DbResult<Option<Self>> {
        let row = pool
            .fetch_one(
                r#"
                SELECT * FROM jobs WHERE id = ?
                "#,
                &[&id.to_string()],
            )
            .await?;
        Ok(Some(Self::from_row(row)?))
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            UPDATE jobs SET
                user_id = ?,
                title = ?,
                company = ?,
                location = ?,
                job_type = ?,
                salary_min = ?,
                salary_max = ?,
                salary_currency = ?,
                salary_period = ?,
                description = ?,
                url = ?,
                posted_at = ?,
                experience_level = ?,
                skills = ?,
                remote = ?,
                source = ?,
                updated_at = ?
            WHERE id = ?
            "#,
            &[
                &model.user_id.to_string(),
                &model.title,
                &model.company,
                &model.location,
                &model.job_type,
                &model.salary_min,
                &model.salary_max,
                &model.salary_currency,
                &model.salary_period,
                &model.description,
                &model.url,
                &model.posted_at.to_rfc3339(),
                &model.experience_level,
                &serde_json::to_string(&model.skills)?,
                &model.remote,
                &model.source,
                &model.updated_at.to_rfc3339(),
                &model.id.to_string(),
            ],
        )
        .await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &Id) -> DbResult<()> {
        pool.execute(
            r#"
            DELETE FROM jobs WHERE id = ?
            "#,
            &[&id.to_string()],
        )
        .await?;
        Ok(())
    }

    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: Uuid::parse_str(&row.get::<String>("id")?)?,
            user_id: Uuid::parse_str(&row.get::<String>("user_id")?)?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            job_type: row.get("job_type")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            salary_currency: row.get("salary_currency")?,
            salary_period: row.get("salary_period")?,
            description: row.get("description")?,
            url: row.get("url")?,
            posted_at: DateTime::parse_from_rfc3339(&row.get::<String>("posted_at")?)?.with_timezone(&Utc),
            experience_level: row.get("experience_level")?,
            skills: serde_json::from_str(&row.get::<String>("skills")?)?,
            remote: row.get("remote")?,
            source: row.get("source")?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<String>("created_at")?)?.with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<String>("updated_at")?)?.with_timezone(&Utc),
        })
    }
}

impl Job {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &Id) -> DbResult<Vec<Self>> {
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC
                "#,
                &[&user_id.to_string()],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }

    pub async fn search(pool: &DbPool, user_id: &Id, query: &str) -> DbResult<Vec<Self>> {
        let search_pattern = format!("%{}%", query);
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM jobs 
                WHERE user_id = ? 
                AND (
                    title LIKE ? 
                    OR company LIKE ? 
                    OR description LIKE ?
                )
                ORDER BY created_at DESC
                "#,
                &[
                    &user_id.to_string(),
                    &search_pattern,
                    &search_pattern,
                    &search_pattern,
                ],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }
} 