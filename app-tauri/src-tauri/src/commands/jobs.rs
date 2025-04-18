use crate::models::job::Job;
use crate::models::types::Id;
use crate::types::{DbPool, DbResult};
use tauri::State;
use tauri_plugin_sql::TauriSql;
use chrono::Utc;

#[tauri::command]
pub async fn create_job(
    db: State<'_, TauriSql>,
    job: Job,
) -> Result<Id, String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::create(&pool, &job).await.map_err(|e| e.to_string())?;
    Ok(job.id)
}

#[tauri::command]
pub async fn get_job(
    db: State<'_, TauriSql>,
    job_id: Id,
) -> Result<Job, String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::find_by_id(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Job not found".to_string())
}

#[tauri::command]
pub async fn update_job(
    db: State<'_, TauriSql>,
    job: Job,
) -> Result<(), String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::update(&pool, &job).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_job(
    db: State<'_, TauriSql>,
    job_id: Id,
) -> Result<(), String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::delete(&pool, &job_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_jobs(
    db: State<'_, TauriSql>,
    user_id: Id,
) -> Result<Vec<Job>, String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::find_by_user_id(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_jobs(
    db: State<'_, TauriSql>,
    user_id: Id,
    query: String,
) -> Result<Vec<Job>, String> {
    let pool = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Job::search(&pool, &user_id, &query)
        .await
        .map_err(|e| e.to_string())
} 