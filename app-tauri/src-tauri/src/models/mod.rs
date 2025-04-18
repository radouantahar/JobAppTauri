use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde_json;
use crate::db::{Row, SqlitePool};
use crate::types::{DbResult, DbPool, DbRow};
use anyhow::Result;

pub mod traits;
pub use traits::DatabaseModel;

pub mod user;
pub mod user_profile;
pub mod document;
pub mod application;
pub mod job;
pub mod search_preference;
pub mod llm_provider;
pub mod document_template;
pub mod generated_document;
pub mod job_stats;
pub mod application_stats;
pub mod kanban;

pub use user::User;
pub use user_profile::UserProfile;
pub use document::Document;
pub use application::Application;
pub use job::Job;
pub use search_preference::SearchPreference;
pub use llm_provider::LLMProvider;
pub use document_template::DocumentTemplate;
pub use generated_document::GeneratedDocument;
pub use job_stats::JobStats;
pub use application_stats::ApplicationStats;
pub use kanban::{KanbanColumn, KanbanCard};

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
pub struct LLMModel {
    pub name: String,
    pub max_tokens: i32,
    pub supports_json: Option<bool>,
    pub is_fine_tuned: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentFeedback {
    pub rating: Option<i32>,
    pub comments: Option<String>,
}

impl Application {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Vec<Self>> {
        let mut rows = pool.query(
            "SELECT * FROM applications WHERE user_id = ? ORDER BY applied_date DESC",
            &[&user_id]
        )?;
        
        let mut applications = Vec::new();
        while let Some(row) = rows.next()? {
            applications.push(Self::from_row(row)?);
        }
        Ok(applications)
    }
} 