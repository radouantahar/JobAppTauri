use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: i64,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub locations: UserLocations,
    pub cv: CVInfo,
    pub preferences: Option<UserPreferences>,
    pub job_preferences: Option<JobPreferences>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: i64,
    pub title: String,
    pub company: String,
    pub location: String,
    pub description: String,
    pub url: String,
    pub source: String,
    pub published_at: String,
    pub salary: Option<SalaryRange>,
    pub matching_score: f64,
    pub commute_times: CommuteTimes,
    pub skills: Option<Vec<String>>,
    pub experience_level: Option<String>,
    pub applied_at: Option<String>,
    pub status: Option<String>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct JobStats {
    pub total_jobs: i64,
    pub trend_data: TrendData,
    pub source_distribution: DistributionData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrendData {
    pub labels: Vec<String>,
    pub values: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DistributionData {
    pub labels: Vec<String>,
    pub values: Vec<i64>,
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
    pub id: i64,
    pub user_id: i64,
    pub job_id: i64,
    pub status: String,
    pub applied_at: Option<String>,
    pub response_received: bool,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub stages: Option<Vec<ApplicationStage>>,
    pub documents: Option<Vec<ApplicationDocument>>,
    pub application_notes: Option<Vec<ApplicationNote>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationStage {
    pub id: i64,
    pub application_id: i64,
    pub stage_type: String,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub notes: Option<String>,
    pub outcome: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationDocument {
    pub id: i64,
    pub application_id: i64,
    pub document_type: String,
    pub file_path: Option<String>,
    pub content: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationNote {
    pub id: i64,
    pub application_id: i64,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
} 