use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchCriteria {
    pub keywords: String,
    pub location: String,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub contract_types: Vec<String>,
    pub experience_levels: Vec<String>,
    pub remote: Option<bool>,
    pub skills: Vec<String>,
    pub date_posted: Option<String>,
    pub sort_by: Option<String>,
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
    state: State<'_, AppState>,
    criteria: SearchCriteria,
) -> Result<Vec<JobResult>, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut query = String::from(
        "SELECT id, title, company, location, job_type, salary_min, salary_max, 
        description, url, posted_at, experience_level, skills, remote, source 
        FROM jobs WHERE 1=1",
    );

    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if !criteria.keywords.is_empty() {
        query.push_str(" AND (title LIKE ? OR description LIKE ? OR company LIKE ?)");
        let keyword = format!("%{}%", criteria.keywords);
        params.push(Box::new(keyword.clone()));
        params.push(Box::new(keyword.clone()));
        params.push(Box::new(keyword));
    }

    if !criteria.location.is_empty() {
        query.push_str(" AND location LIKE ?");
        params.push(Box::new(format!("%{}%", criteria.location)));
    }

    if let Some(salary_min) = criteria.salary_min {
        query.push_str(" AND salary_min >= ?");
        params.push(Box::new(salary_min));
    }

    if let Some(salary_max) = criteria.salary_max {
        query.push_str(" AND salary_max <= ?");
        params.push(Box::new(salary_max));
    }

    if !criteria.contract_types.is_empty() {
        query.push_str(" AND job_type IN (");
        for (i, _) in criteria.contract_types.iter().enumerate() {
            if i > 0 {
                query.push(',');
            }
            query.push('?');
        }
        query.push(')');
        for contract_type in criteria.contract_types {
            params.push(Box::new(contract_type));
        }
    }

    if !criteria.experience_levels.is_empty() {
        query.push_str(" AND experience_level IN (");
        for (i, _) in criteria.experience_levels.iter().enumerate() {
            if i > 0 {
                query.push(',');
            }
            query.push('?');
        }
        query.push(')');
        for level in criteria.experience_levels {
            params.push(Box::new(level));
        }
    }

    if let Some(remote) = criteria.remote {
        query.push_str(" AND remote = ?");
        params.push(Box::new(remote));
    }

    if !criteria.skills.is_empty() {
        query.push_str(" AND (");
        for (i, skill) in criteria.skills.iter().enumerate() {
            if i > 0 {
                query.push_str(" OR ");
            }
            query.push_str("skills LIKE ?");
            params.push(Box::new(format!("%{}%", skill)));
        }
        query.push(')');
    }

    if let Some(date_posted) = criteria.date_posted {
        query.push_str(" AND posted_at >= ?");
        params.push(Box::new(date_posted));
    }

    if let Some(sort_by) = criteria.sort_by {
        match sort_by.as_str() {
            "date" => query.push_str(" ORDER BY posted_at DESC"),
            "salary" => query.push_str(" ORDER BY salary_max DESC"),
            _ => query.push_str(" ORDER BY posted_at DESC"),
        }
    } else {
        query.push_str(" ORDER BY posted_at DESC");
    }

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let jobs = stmt
        .query_map(
            rusqlite::params_from_iter(params.iter().map(|p| p.as_ref())),
            |row| {
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
            },
        )
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(jobs)
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