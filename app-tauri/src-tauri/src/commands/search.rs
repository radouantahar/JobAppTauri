use crate::models::{Job, SearchPreference};
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchCriteria {
    pub keywords: Vec<String>,
    pub location: Option<String>,
    pub radius: Option<i32>,
    pub min_salary: Option<f64>,
    pub job_type: Option<String>,
    pub experience_level: Option<String>,
    pub remote_preference: Option<String>,
    pub date_posted: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobResult {
    pub id: i64,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_type: String,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub description: String,
    pub url: String,
    pub posted_at: String,
    pub experience_level: String,
    pub skills: Vec<String>,
    pub remote: bool,
    pub source: String,
}

#[tauri::command]
pub async fn search_jobs(
    db: State<'_, TauriSql>,
    criteria: SearchCriteria,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut query = "SELECT * FROM jobs WHERE 1=1".to_string();
    let mut params: Vec<String> = Vec::new();

    if !criteria.keywords.is_empty() {
        query.push_str(" AND (");
        for (i, keyword) in criteria.keywords.iter().enumerate() {
            if i > 0 {
                query.push_str(" OR ");
            }
            query.push_str("(title LIKE ? OR description LIKE ?)");
            params.push(format!("%{}%", keyword));
            params.push(format!("%{}%", keyword));
        }
        query.push_str(")");
    }

    if let Some(location) = criteria.location {
        query.push_str(" AND location LIKE ?");
        params.push(format!("%{}%", location));
    }

    if let Some(job_type) = criteria.job_type {
        query.push_str(" AND job_type = ?");
        params.push(job_type);
    }

    if let Some(experience_level) = criteria.experience_level {
        query.push_str(" AND experience_level = ?");
        params.push(experience_level);
    }

    if let Some(remote_preference) = criteria.remote_preference {
        query.push_str(" AND remote = ?");
        params.push(remote_preference);
    }

    query.push_str(" ORDER BY posted_at DESC");

    let jobs: Vec<Job> = sqlx::query_as(&query)
        .bind_all(params)
        .fetch_all(&conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(jobs)
}

#[tauri::command]
pub async fn get_search_preferences(
    db: State<'_, TauriSql>,
) -> Result<Vec<SearchPreference>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let preferences: Vec<SearchPreference> = sqlx::query_as!(
        SearchPreference,
        r#"
        SELECT * FROM search_preferences ORDER BY created_at DESC
        "#
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(preferences)
}

#[tauri::command]
pub async fn update_search_preferences(
    db: State<'_, TauriSql>,
    preferences: SearchPreference,
) -> Result<bool, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        INSERT INTO search_preferences (keywords, location, radius, min_salary, job_type,
            experience_level, remote_preference, date_posted, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
            keywords = $1,
            location = $2,
            radius = $3,
            min_salary = $4,
            job_type = $5,
            experience_level = $6,
            remote_preference = $7,
            date_posted = $8,
            updated_at = $10
        "#,
        preferences.keywords,
        preferences.location,
        preferences.radius,
        preferences.min_salary,
        preferences.job_type,
        preferences.experience_level,
        preferences.remote_preference,
        preferences.date_posted,
        Utc::now(),
        Utc::now()
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub async fn get_job_details(
    state: State<'_, AppState>,
    job_id: i64,
) -> Result<Option<JobResult>, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, company, location, job_type, salary_min, salary_max, 
            description, url, posted_at, experience_level, skills, remote, source 
            FROM jobs WHERE id = ?",
        )
        .map_err(|e| e.to_string())?;

    let job = stmt
        .query_row(params![job_id], |row| {
            Ok(JobResult {
                id: row.get(0)?,
                title: row.get(1)?,
                company: row.get(2)?,
                location: row.get(3)?,
                job_type: row.get(4)?,
                salary_min: row.get(5)?,
                salary_max: row.get(6)?,
                description: row.get(7)?,
                url: row.get(8)?,
                posted_at: row.get(9)?,
                experience_level: row.get(10)?,
                skills: serde_json::from_str(&row.get::<_, String>(11)?).unwrap_or_default(),
                remote: row.get(12)?,
                source: row.get(13)?,
            })
        })
        .ok();

    Ok(job)
} 