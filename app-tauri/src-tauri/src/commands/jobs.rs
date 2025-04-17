use crate::models::sql_models::Job;
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub async fn create_job(
    db: State<'_, TauriSql>,
    job: Job,
) -> Result<Uuid, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let job_id = Uuid::new_v4();
    
    sqlx::query!(
        r#"
        INSERT INTO jobs (
            id, user_id, title, company, location, type, posted_at,
            experience, salary_min, salary_max, salary_currency,
            salary_period, description, url, remote, skills,
            job_type, experience_level, source, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20, $21
        )
        "#,
        job_id,
        job.user_id,
        job.title,
        job.company,
        job.location,
        job.job_type,
        job.posted_at,
        job.experience_level,
        job.salary_min,
        job.salary_max,
        job.salary_currency,
        job.salary_period,
        job.description,
        job.url,
        job.remote,
        job.skills,
        job.job_type,
        job.experience_level,
        job.source,
        Utc::now(),
        Utc::now()
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(job_id)
}

#[tauri::command]
pub async fn get_job(
    db: State<'_, TauriSql>,
    job_id: Uuid,
) -> Result<Job, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let job: Job = sqlx::query_as!(
        Job,
        r#"
        SELECT * FROM jobs WHERE id = $1
        "#,
        job_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(job)
}

#[tauri::command]
pub async fn update_job(
    db: State<'_, TauriSql>,
    job: Job,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE jobs
        SET title = $1, company = $2, location = $3, type = $4,
            posted_at = $5, experience = $6, salary_min = $7,
            salary_max = $8, salary_currency = $9, salary_period = $10,
            description = $11, url = $12, remote = $13, skills = $14,
            job_type = $15, experience_level = $16, source = $17,
            updated_at = $18
        WHERE id = $19
        "#,
        job.title,
        job.company,
        job.location,
        job.job_type,
        job.posted_at,
        job.experience_level,
        job.salary_min,
        job.salary_max,
        job.salary_currency,
        job.salary_period,
        job.description,
        job.url,
        job.remote,
        job.skills,
        job.job_type,
        job.experience_level,
        job.source,
        Utc::now(),
        job.id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_job(
    db: State<'_, TauriSql>,
    job_id: Uuid,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        DELETE FROM jobs WHERE id = $1
        "#,
        job_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn list_jobs(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let jobs: Vec<Job> = sqlx::query_as!(
        Job,
        r#"
        SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(jobs)
}

#[tauri::command]
pub async fn search_jobs(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    query: String,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let jobs: Vec<Job> = sqlx::query_as!(
        Job,
        r#"
        SELECT * FROM jobs 
        WHERE user_id = $1 
        AND (
            title ILIKE $2 
            OR company ILIKE $2 
            OR description ILIKE $2
        )
        ORDER BY created_at DESC
        "#,
        user_id,
        format!("%{}%", query)
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(jobs)
} 