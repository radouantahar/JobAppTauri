use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchCriteria {
    pub keywords: Vec<String>,
    pub location: String,
    pub job_type: Option<Vec<String>>,
    pub remote_only: bool,
    pub date_posted: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: String,
    pub title: String,
    pub company: String,
    pub location: String,
    pub description: String,
    pub url: String,
    pub date_posted: String,
    pub salary: Option<String>,
    pub matching_score: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobSearchResult {
    pub jobs: Vec<Job>,
    pub stats: JobSearchStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobSearchStats {
    pub total: usize,
    pub new: usize,
    pub updated: usize,
}