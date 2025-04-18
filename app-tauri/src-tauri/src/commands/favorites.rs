use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::models::job::Job;

#[derive(Debug, Serialize, Deserialize)]
pub struct FavoriteJob {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[tauri::command]
pub async fn add_favorite_job(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    job_id: Uuid,
) -> Result<FavoriteJob, String> {
    let conn = db.get("sqlite:app.db")?;

    // Vérifier si le job existe
    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE id = ?",
        &[&job_id.to_string()],
    )?;

    let job = if let Some(row) = rows.next()? {
        Some(Job {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            description: row.get("description")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            job_type: row.get("job_type")?,
            experience_level: row.get("experience_level")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
            status: row.get("status")?,
            url: row.get("url")?,
        })
    } else {
        None
    };

    if job.is_none() {
        return Err("Job not found".to_string());
    }

    // Vérifier si le job est déjà dans les favoris
    let mut rows = conn.query(
        "SELECT * FROM favorite_jobs WHERE user_id = ? AND job_id = ?",
        &[&user_id.to_string(), &job_id.to_string()],
    )?;

    if rows.next()?.is_some() {
        return Err("Job already in favorites".to_string());
    }

    // Ajouter aux favoris
    let favorite_id = Uuid::new_v4();
    let now = Utc::now();

    conn.execute(
        r#"
        INSERT INTO favorite_jobs (id, user_id, job_id, created_at)
        VALUES (?, ?, ?, ?)
        "#,
        &[
            &favorite_id.to_string(),
            &user_id.to_string(),
            &job_id.to_string(),
            &now,
        ],
    )?;

    Ok(FavoriteJob {
        id: favorite_id,
        user_id,
        job_id,
        created_at: now,
    })
}

#[tauri::command]
pub async fn remove_favorite_job(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    job_id: Uuid,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db")?;

    conn.execute(
        "DELETE FROM favorite_jobs WHERE user_id = ? AND job_id = ?",
        &[&user_id.to_string(), &job_id.to_string()],
    )?;

    Ok(())
}

#[tauri::command]
pub async fn get_favorite_jobs(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<Job>, String> {
    let conn = db.get("sqlite:app.db")?;

    let mut rows = conn.query(
        r#"
        SELECT j.* 
        FROM jobs j
        INNER JOIN favorite_jobs f ON j.id = f.job_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        "#,
        &[&user_id.to_string()],
    )?;

    let mut jobs = Vec::new();
    while let Some(row) = rows.next()? {
        jobs.push(Job {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            description: row.get("description")?,
            salary_min: row.get("salary_min")?,
            salary_max: row.get("salary_max")?,
            job_type: row.get("job_type")?,
            experience_level: row.get("experience_level")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
            status: row.get("status")?,
            url: row.get("url")?,
        });
    }

    Ok(jobs)
}

#[tauri::command]
pub async fn is_job_favorite(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    job_id: Uuid,
) -> Result<bool, String> {
    let conn = db.get("sqlite:app.db")?;

    let mut rows = conn.query(
        "SELECT * FROM favorite_jobs WHERE user_id = ? AND job_id = ?",
        &[&user_id.to_string(), &job_id.to_string()],
    )?;

    Ok(rows.next()?.is_some())
} 