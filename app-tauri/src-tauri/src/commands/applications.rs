use crate::{
    models::{Application, ApplicationDocument, ApplicationNote, ApplicationStage, Job},
    AppState,
};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_sql::{TauriSql, SqlitePool};
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApplicationRequest {
    pub job_id: i64,
    pub status: String,
    pub notes: Option<String>,
}

#[tauri::command]
pub async fn create_application(
    user_id: Uuid,
    job_id: Uuid,
    status: String,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // Vérifier si le job existe
    let job = Job::find_by_id(&pool, job_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Job not found".to_string())?;

    // Créer la candidature
    let application = Application {
        id: Uuid::new_v4(),
        user_id,
        job_id,
        status,
        applied_date: Utc::now(),
        notes,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Sauvegarder la candidature
    application.create(&pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_application(
    db: State<'_, TauriSql>,
    application_id: Uuid,
) -> Result<Application, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let application: Application = sqlx::query_as!(
        Application,
        r#"
        SELECT * FROM applications WHERE id = $1
        "#,
        application_id
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(application)
}

#[tauri::command]
pub async fn update_application(
    db: State<'_, TauriSql>,
    application: Application,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE applications
        SET status = $1, applied_at = $2, notes = $3,
            cv_path = $4, cover_letter_path = $5,
            updated_at = $6
        WHERE id = $7
        "#,
        application.status,
        application.applied_at,
        application.notes,
        application.cv_path,
        application.cover_letter_path,
        Utc::now(),
        application.id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_application(
    db: State<'_, TauriSql>,
    application_id: Uuid,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        DELETE FROM applications WHERE id = $1
        "#,
        application_id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn list_applications(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let applications: Vec<Application> = sqlx::query_as!(
        Application,
        r#"
        SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(applications)
}

#[tauri::command]
pub async fn get_applications_by_job(
    db: State<'_, TauriSql>,
    job_id: Uuid,
) -> Result<Vec<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let applications: Vec<Application> = sqlx::query_as!(
        Application,
        r#"
        SELECT * FROM applications WHERE job_id = $1 ORDER BY created_at DESC
        "#,
        job_id
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(applications)
}

#[tauri::command]
pub async fn get_applications_by_status(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    status: String,
) -> Result<Vec<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let applications: Vec<Application> = sqlx::query_as!(
        Application,
        r#"
        SELECT * FROM applications 
        WHERE user_id = $1 AND status = $2 
        ORDER BY created_at DESC
        "#,
        user_id,
        status
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(applications)
}

#[tauri::command]
pub async fn update_application_status(
    application_id: Uuid,
    status: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE applications
        SET status = ?, updated_at = ?
        WHERE id = ?
        "#,
        status,
        Utc::now(),
        application_id.to_string()
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn add_application_stage(
    state: State<'_, AppState>,
    application_id: i64,
    stage_type: String,
    scheduled_at: Option<String>,
) -> Result<ApplicationStage, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO application_stages (application_id, stage_type, scheduled_at) 
             VALUES (?, ?, ?) 
             RETURNING id, application_id, stage_type, scheduled_at, completed_at, notes, outcome, created_at, updated_at",
        )
        .map_err(|e| e.to_string())?;

    let stage = stmt
        .query_row(
            params![application_id, stage_type, scheduled_at],
            |row| {
                Ok(ApplicationStage {
                    id: row.get(0)?,
                    application_id: row.get(1)?,
                    stage_type: row.get(2)?,
                    scheduled_at: row.get(3)?,
                    completed_at: row.get(4)?,
                    notes: row.get(5)?,
                    outcome: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(stage)
}

#[tauri::command]
pub async fn add_application_note(
    application_id: Uuid,
    note: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE applications
        SET notes = ?, updated_at = ?
        WHERE id = ?
        "#,
        note,
        Utc::now(),
        application_id.to_string()
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn add_application_document(
    state: State<'_, AppState>,
    application_id: i64,
    document_type: String,
    file_path: Option<String>,
    content: Option<String>,
) -> Result<ApplicationDocument, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO application_documents (application_id, document_type, file_path, content) 
             VALUES (?, ?, ?, ?) 
             RETURNING id, application_id, document_type, file_path, content, created_at, updated_at",
        )
        .map_err(|e| e.to_string())?;

    let document = stmt
        .query_row(
            params![application_id, document_type, file_path, content],
            |row| {
                Ok(ApplicationDocument {
                    id: row.get(0)?,
                    application_id: row.get(1)?,
                    document_type: row.get(2)?,
                    file_path: row.get(3)?,
                    content: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(document)
}

#[tauri::command]
pub async fn get_user_applications(
    user_id: Uuid,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Application>, String> {
    // Récupérer les candidatures de l'utilisateur
    let applications = Application::find_by_user_id(&pool, user_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(applications)
} 