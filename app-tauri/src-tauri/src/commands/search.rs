use crate::models::{Job, SearchPreference as ModelSearchPreference};
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

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
    pub skills: Vec<String>,
    pub remote: bool,
    pub source: String,
    pub relevance_score: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub keyword: Option<String>,
    pub location: Option<String>,
    pub job_type: Option<String>,
    pub min_salary: Option<f64>,
    pub max_salary: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPreference {
    pub id: Uuid,
    pub user_id: Uuid,
    pub keyword: Option<String>,
    pub location: Option<String>,
    pub job_type: Option<String>,
    pub min_salary: Option<f64>,
    pub max_salary: Option<f64>,
    pub created_at: DateTime<Utc>,
}

#[tauri::command]
pub async fn search_jobs(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    keyword: Option<String>,
    location: Option<String>,
    job_type: Option<String>,
    min_salary: Option<f64>,
    max_salary: Option<f64>,
) -> Result<Vec<JobResult>, String> {
    let conn = db.get("sqlite:app.db")?;

    let mut query = String::from(
        r#"
        SELECT j.*,
        CASE 
            WHEN ? IS NULL THEN 1.0
            ELSE (
                CASE 
                    WHEN j.title LIKE ? THEN 2.0
                    WHEN j.description LIKE ? THEN 1.0
                    ELSE 0.0
                END +
                CASE 
                    WHEN j.company LIKE ? THEN 0.5
                    ELSE 0.0
                END
            )
        END as relevance_score
        FROM jobs j
        WHERE 1=1
        "#,
    );

    let mut params: Vec<String> = Vec::new();
    
    // Paramètres de base pour le score de pertinence
    if let Some(ref kw) = keyword {
        let pattern = format!("%{}%", kw);
        params.push(kw.clone());
        params.push(pattern.clone());
        params.push(pattern.clone());
        params.push(pattern);
    } else {
        params.push(String::new());
        params.push(String::new());
        params.push(String::new());
        params.push(String::new());
    }

    if let Some(loc) = location {
        query.push_str(" AND j.location LIKE ?");
        params.push(format!("%{}%", loc));
    }

    if let Some(jt) = job_type {
        query.push_str(" AND j.job_type = ?");
        params.push(jt);
    }

    if let Some(min) = min_salary {
        query.push_str(" AND j.salary_max >= ?");
        params.push(min.to_string());
    }

    if let Some(max) = max_salary {
        query.push_str(" AND j.salary_min <= ?");
        params.push(max.to_string());
    }

    query.push_str(" ORDER BY relevance_score DESC, j.created_at DESC");

    // Sauvegarder la recherche dans les préférences
    let preference_id = Uuid::new_v4();
    let now = Utc::now();

    conn.execute(
        r#"
        INSERT INTO search_preferences (
            id, user_id, keyword, location, job_type, 
            min_salary, max_salary, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &preference_id.to_string(),
            &user_id.to_string(),
            &keyword.unwrap_or_default(),
            &location.unwrap_or_default(),
            &job_type.unwrap_or_default(),
            &min_salary.map(|s| s.to_string()).unwrap_or_default(),
            &max_salary.map(|s| s.to_string()).unwrap_or_default(),
            &now,
        ],
    )?;

    // Exécuter la recherche
    let mut rows = conn.query(&query, &params.iter().map(|s| s as &str).collect::<Vec<_>>())?;

    let mut results = Vec::new();
    while let Some(row) = rows.next()? {
        results.push(JobResult {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            job_type: row.get("job_type")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            description: row.get("description")?,
            url: row.get("url")?,
            posted_at: row.get("posted_at")?,
            experience_level: row.get("experience_level")?,
            skills: serde_json::from_str(&row.get::<String>("skills")?).map_err(|e| e.to_string())?,
            remote: row.get("remote")?,
            source: row.get("source")?,
            relevance_score: row.get("relevance_score")?,
        });
    }

    Ok(results)
}

#[tauri::command]
pub async fn get_search_preferences(
    db: State<'_, TauriSql>,
) -> Result<Vec<ModelSearchPreference>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM search_preferences ORDER BY created_at DESC",
        &[],
    )?;

    let mut preferences = Vec::new();
    while let Some(row) = rows.next()? {
        preferences.push(ModelSearchPreference {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            user_id: Uuid::parse_str(&row.get::<String>("user_id")?).map_err(|e| e.to_string())?,
            keyword: row.get("keyword")?,
            location: row.get("location")?,
            job_type: row.get("job_type")?,
            min_salary: row.get::<String>("min_salary")?.parse().ok(),
            max_salary: row.get::<String>("max_salary")?.parse().ok(),
            created_at: row.get("created_at")?,
        });
    }

    Ok(preferences)
}

#[tauri::command]
pub async fn update_search_preferences(
    db: State<'_, TauriSql>,
    preferences: ModelSearchPreference,
) -> Result<bool, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"
        INSERT INTO search_preferences (
            id, user_id, keyword, location, job_type,
            min_salary, max_salary, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
            keyword = ?,
            location = ?,
            job_type = ?,
            min_salary = ?,
            max_salary = ?,
            created_at = ?
        "#,
        &[
            &preferences.id.to_string(),
            &preferences.user_id.to_string(),
            &preferences.keyword.unwrap_or_default(),
            &preferences.location.unwrap_or_default(),
            &preferences.job_type.unwrap_or_default(),
            &preferences.min_salary.map(|s| s.to_string()).unwrap_or_default(),
            &preferences.max_salary.map(|s| s.to_string()).unwrap_or_default(),
            &preferences.created_at,
            &preferences.keyword.unwrap_or_default(),
            &preferences.location.unwrap_or_default(),
            &preferences.job_type.unwrap_or_default(),
            &preferences.min_salary.map(|s| s.to_string()).unwrap_or_default(),
            &preferences.max_salary.map(|s| s.to_string()).unwrap_or_default(),
            &preferences.created_at,
        ],
    )?;

    Ok(true)
}

#[tauri::command]
pub async fn get_job_details(
    db: State<'_, TauriSql>,
    job_id: Uuid,
) -> Result<Option<JobResult>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE id = ?",
        &[&job_id.to_string()],
    )?;

    if let Some(row) = rows.next()? {
        Ok(Some(JobResult {
            id: job_id,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            job_type: row.get("job_type")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            description: row.get("description")?,
            url: row.get("url")?,
            posted_at: row.get("posted_at")?,
            experience_level: row.get("experience_level")?,
            skills: serde_json::from_str(&row.get::<String>("skills")?).map_err(|e| e.to_string())?,
            remote: row.get("remote")?,
            source: row.get("source")?,
            relevance_score: None,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn get_job_by_id(
    db: State<'_, TauriSql>,
    job_id: String,
) -> Result<Job, String> {
    let conn = db.get("sqlite:app.db")?;
    
    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE id = ?",
        &[&job_id],
    )?;

    if let Some(row) = rows.next()? {
        Ok(Job::from(row))
    } else {
        Err("Job not found".to_string())
    }
}

#[tauri::command]
pub async fn get_recent_jobs(
    db: State<'_, TauriSql>,
    limit: i64,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db")?;
    
    let mut rows = conn.query(
        "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?",
        &[&limit],
    )?;

    let mut jobs = Vec::new();
    while let Some(row) = rows.next()? {
        jobs.push(Job::from(row));
    }

    Ok(jobs)
}

#[tauri::command]
pub async fn get_jobs_by_company(
    db: State<'_, TauriSql>,
    company: String,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db")?;
    
    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE company = ? ORDER BY created_at DESC",
        &[&company],
    )?;

    let mut jobs = Vec::new();
    while let Some(row) = rows.next()? {
        jobs.push(Job::from(row));
    }

    Ok(jobs)
}

#[tauri::command]
pub async fn get_recent_searches(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<SearchPreference>, String> {
    let conn = db.get("sqlite:app.db")?;

    let mut rows = conn.query(
        r#"
        SELECT * FROM search_preferences
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
        "#,
        &[&user_id.to_string()],
    )?;

    let mut preferences = Vec::new();
    while let Some(row) = rows.next()? {
        preferences.push(SearchPreference {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            user_id: Uuid::parse_str(&row.get::<String>("user_id")?).map_err(|e| e.to_string())?,
            keyword: row.get("keyword")?,
            location: row.get("location")?,
            job_type: row.get("job_type")?,
            min_salary: row.get::<String>("min_salary")?.parse().ok(),
            max_salary: row.get::<String>("max_salary")?.parse().ok(),
            created_at: row.get("created_at")?,
        });
    }

    Ok(preferences)
}

#[tauri::command]
pub async fn clear_search_history(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db")?;

    conn.execute(
        "DELETE FROM search_preferences WHERE user_id = ?",
        &[&user_id.to_string()],
    )?;

    Ok(())
} 