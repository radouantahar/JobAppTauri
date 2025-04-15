use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: i64,
    pub title: String,
    pub company: String,
    pub status: String,
    pub matching_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub content: String,
    pub document_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentTemplate {
    pub id: i64,
    pub template_type: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPreferences {
    pub user_id: i64,
    pub keywords: Option<String>,
    pub locations: Option<String>,
    pub salary_range: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobApplication {
    pub id: i64,
    pub user_id: i64,
    pub job_id: i64,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobSearchRequest {
    pub keywords: Option<String>,
    pub location: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobStats {
    pub total_jobs: i64,
    pub status_distribution: Vec<(String, i64)>,
    pub source_distribution: Vec<(String, i64)>,
} 