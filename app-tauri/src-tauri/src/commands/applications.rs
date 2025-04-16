use crate::{
    models::{Application, ApplicationDocument, ApplicationNote, ApplicationStage},
    AppState,
};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApplicationRequest {
    pub job_id: i64,
    pub status: String,
    pub notes: Option<String>,
}

#[tauri::command]
pub async fn create_application(
    state: State<'_, AppState>,
    request: CreateApplicationRequest,
) -> Result<Application, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO applications (user_id, job_id, status, notes) 
             VALUES (?, ?, ?, ?) 
             RETURNING id, user_id, job_id, status, applied_at, response_received, notes, created_at, updated_at",
        )
        .map_err(|e| e.to_string())?;

    let application = stmt
        .query_row(
            params![1, request.job_id, request.status, request.notes],
            |row| {
                Ok(Application {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    status: row.get(3)?,
                    applied_at: row.get(4)?,
                    response_received: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                    stages: None,
                    documents: None,
                    application_notes: None,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(application)
}

#[tauri::command]
pub async fn get_application(
    state: State<'_, AppState>,
    application_id: i64,
) -> Result<Application, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, job_id, status, applied_at, response_received, notes, created_at, updated_at 
             FROM applications 
             WHERE id = ?",
        )
        .map_err(|e| e.to_string())?;

    let application = stmt
        .query_row(params![application_id], |row| {
            Ok(Application {
                id: row.get(0)?,
                user_id: row.get(1)?,
                job_id: row.get(2)?,
                status: row.get(3)?,
                applied_at: row.get(4)?,
                response_received: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                stages: None,
                documents: None,
                application_notes: None,
            })
        })
        .map_err(|e| e.to_string())?;

    // Récupérer les étapes
    let mut stmt = conn
        .prepare(
            "SELECT id, application_id, stage_type, scheduled_at, completed_at, notes, outcome, created_at, updated_at 
             FROM application_stages 
             WHERE application_id = ?",
        )
        .map_err(|e| e.to_string())?;

    let stages: Vec<ApplicationStage> = stmt
        .query_map(params![application_id], |row| {
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
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Récupérer les documents
    let mut stmt = conn
        .prepare(
            "SELECT id, application_id, document_type, file_path, content, created_at, updated_at 
             FROM application_documents 
             WHERE application_id = ?",
        )
        .map_err(|e| e.to_string())?;

    let documents: Vec<ApplicationDocument> = stmt
        .query_map(params![application_id], |row| {
            Ok(ApplicationDocument {
                id: row.get(0)?,
                application_id: row.get(1)?,
                document_type: row.get(2)?,
                file_path: row.get(3)?,
                content: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Récupérer les notes
    let mut stmt = conn
        .prepare(
            "SELECT id, application_id, content, created_at, updated_at 
             FROM application_notes 
             WHERE application_id = ?",
        )
        .map_err(|e| e.to_string())?;

    let notes: Vec<ApplicationNote> = stmt
        .query_map(params![application_id], |row| {
            Ok(ApplicationNote {
                id: row.get(0)?,
                application_id: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(Application {
        stages: Some(stages),
        documents: Some(documents),
        application_notes: Some(notes),
        ..application
    })
}

#[tauri::command]
pub async fn update_application_status(
    state: State<'_, AppState>,
    application_id: i64,
    status: String,
) -> Result<bool, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let rows_affected = conn
        .execute(
            "UPDATE applications SET status = ? WHERE id = ?",
            params![status, application_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(rows_affected > 0)
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
    state: State<'_, AppState>,
    application_id: i64,
    content: String,
) -> Result<ApplicationNote, String> {
    let conn = state.db.lock().await;
    let conn = conn.as_ref().ok_or("Database connection not initialized")?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO application_notes (application_id, content) 
             VALUES (?, ?) 
             RETURNING id, application_id, content, created_at, updated_at",
        )
        .map_err(|e| e.to_string())?;

    let note = stmt
        .query_row(params![application_id, content], |row| {
            Ok(ApplicationNote {
                id: row.get(0)?,
                application_id: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(note)
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