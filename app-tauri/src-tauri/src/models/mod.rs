use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use uuid::Uuid;
use serde_json;
use tauri_plugin_sql::SqlitePool;

pub mod user;
pub mod user_profile;
pub mod document;
pub mod sql_models;

pub use self::user::{User, NewUser, UpdateUser};
pub use self::user_profile::{UserProfile, NewUserProfile, UpdateUserProfile};
pub use self::document::{Document, NewDocument, UpdateDocument};
pub use sql_models::{User, Job, Application, Document};

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub async fn create(pool: &SqlitePool, user: &User) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            user.id.to_string(),
            user.email,
            user.password_hash,
            user.first_name,
            user.last_name,
            user.created_at,
            user.updated_at
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>, sqlx::Error> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT * FROM users WHERE email = ?
            "#,
            email
        )
        .fetch_optional(pool)
        .await?;
        Ok(user)
    }
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub location: Option<String>,
    pub primary_home: Option<String>,
    pub secondary_home: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: Uuid,
    pub name: String,
    pub content: String,
    pub document_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Document {
    pub async fn create(pool: &SqlitePool, document: &Document) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO documents (
                id, name, content, document_type,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
            document.id.to_string(),
            document.name,
            document.content,
            document.document_type,
            document.created_at,
            document.updated_at
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Document>, sqlx::Error> {
        let document = sqlx::query_as!(
            Document,
            r#"
            SELECT * FROM documents WHERE id = ?
            "#,
            id.to_string()
        )
        .fetch_optional(pool)
        .await?;
        Ok(document)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserLocations {
    pub primary: String,
    pub secondary: Option<String>,
    pub coordinates: Option<LocationCoordinates>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocationCoordinates {
    pub primary: Coordinates,
    pub secondary: Option<Coordinates>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Coordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CVInfo {
    pub path: PathBuf,
    pub last_updated: String,
    pub skills: Option<Vec<String>>,
    pub experience_years: Option<i32>,
    pub education: Option<Vec<Education>>,
    pub certifications: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Education {
    pub institution: String,
    pub degree: String,
    pub field: String,
    pub start_year: i32,
    pub end_year: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPreferences {
    pub notifications: Option<bool>,
    pub dark_mode: Option<bool>,
    pub language: Option<String>,
    pub commute_mode: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobPreferences {
    pub min_salary: Option<f64>,
    pub preferred_job_types: Option<Vec<String>>,
    pub remote_preference: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Job {
    pub id: Uuid,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_type: String,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub description: String,
    pub url: String,
    pub posted_at: DateTime<Utc>,
    pub experience_level: String,
    pub skills: String,
    pub remote: bool,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Job {
    pub async fn create(pool: &SqlitePool, job: &Job) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO jobs (
                id, title, company, location, job_type, salary_min, salary_max,
                description, url, posted_at, experience_level, skills, remote, source,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            job.id.to_string(),
            job.title,
            job.company,
            job.location,
            job.job_type,
            job.salary_min,
            job.salary_max,
            job.description,
            job.url,
            job.posted_at,
            job.experience_level,
            job.skills,
            job.remote,
            job.source,
            job.created_at,
            job.updated_at
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Job>, sqlx::Error> {
        let job = sqlx::query_as!(
            Job,
            r#"
            SELECT * FROM jobs WHERE id = ?
            "#,
            id.to_string()
        )
        .fetch_optional(pool)
        .await?;
        Ok(job)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalaryRange {
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub currency: Option<String>,
    pub period: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommuteTimes {
    pub primary_home: CommuteLocation,
    pub secondary_home: Option<CommuteLocation>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommuteLocation {
    pub duration: i32,
    pub distance: f64,
    pub mode: String,
    pub coordinates: Option<Coordinates>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KanbanColumn {
    pub id: i64,
    pub name: String,
    pub position: i32,
    pub cards: Vec<KanbanCard>,
    pub color: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KanbanCard {
    pub id: i64,
    pub job_id: i64,
    pub column_id: i64,
    pub position: i32,
    pub job: Job,
    pub notes: Option<String>,
    pub applied_at: Option<String>,
    pub follow_up_date: Option<String>,
    pub documents: Option<CardDocuments>,
    pub interviews: Option<Vec<Interview>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardDocuments {
    pub cv: Option<String>,
    pub cover_letter: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Interview {
    pub date: String,
    pub interview_type: String,
    pub notes: Option<String>,
    pub outcome: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPreference {
    pub id: i64,
    pub name: String,
    pub is_active: bool,
    pub categories: Vec<SearchCategory>,
    pub last_used: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchCategory {
    pub id: i64,
    pub name: String,
    pub keywords: Vec<KeywordWeight>,
    pub priority: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeywordWeight {
    pub keyword: String,
    pub weight: i32,
    pub required: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMProvider {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub is_active: bool,
    pub priority: i32,
    pub models: Vec<LLMModel>,
    pub cost_per_1k_tokens: f64,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub rate_limit: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMModel {
    pub name: String,
    pub max_tokens: i32,
    pub supports_json: Option<bool>,
    pub is_fine_tuned: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentTemplate {
    pub id: i64,
    pub name: String,
    pub template_type: String,
    pub content: String,
    pub variables: Option<Vec<String>>,
    pub is_default: Option<bool>,
    pub language: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedDocument {
    pub id: i64,
    pub job_id: i64,
    pub template_id: i64,
    pub document_type: String,
    pub content: String,
    pub created_at: String,
    pub version: Option<i32>,
    pub feedback: Option<DocumentFeedback>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentFeedback {
    pub rating: Option<i32>,
    pub comments: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct JobStats {
    pub id: Uuid,
    pub job_id: Uuid,
    pub matching_score: f64,
    pub commute_time: Option<i32>,
    pub skills_match: Option<f64>,
    pub experience_match: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationStats {
    pub total_applications: i64,
    pub total_interviews: i64,
    pub total_offers: i64,
    pub success_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Application {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub status: String,
    pub applied_date: DateTime<Utc>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Application {
    pub async fn create(pool: &SqlitePool, application: &Application) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO applications (
                id, user_id, job_id, status, applied_date, notes,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            application.id.to_string(),
            application.user_id.to_string(),
            application.job_id.to_string(),
            application.status,
            application.applied_date,
            application.notes,
            application.created_at,
            application.updated_at
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_user_id(pool: &SqlitePool, user_id: Uuid) -> Result<Vec<Application>, sqlx::Error> {
        let applications = sqlx::query_as!(
            Application,
            r#"
            SELECT * FROM applications WHERE user_id = ?
            "#,
            user_id.to_string()
        )
        .fetch_all(pool)
        .await?;
        Ok(applications)
    }
} 