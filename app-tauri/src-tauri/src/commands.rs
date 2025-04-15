use crate::{
    database::operations::DatabaseOperations,
    models::{Job, JobSearchRequest, JobStats, LoginRequest, RegisterRequest, User, Document, DocumentTemplate},
};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use std::sync::Arc;
use crate::error::AppError;

type DbState<'a> = State<'a, Mutex<DatabaseOperations>>;

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<User, AppError> {
    let user = db.get_user_by_email(&email).await?;
    if user.password == password {
        Ok(user)
    } else {
        Err(AppError::Auth("Invalid credentials".to_string()))
    }
}

#[tauri::command]
pub async fn register(
    email: String,
    password: String,
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<User, AppError> {
    db.create_user(&email, &password).await
}

#[tauri::command]
pub async fn search_jobs(
    request: JobSearchRequest,
    db: State<'_, Mutex<DatabaseOperations>>,
) -> Result<Vec<Job>, String> {
    let db = db.lock().map_err(|_| "Database lock error".to_string())?;
    // TODO: Implement job search logic
    Ok(vec![])
}

#[tauri::command]
pub async fn get_job_stats(
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<JobStats, AppError> {
    db.get_job_stats().await
}

#[tauri::command]
pub async fn get_user_documents(
    state: State<'_, Mutex<DatabaseOperations>>,
    user_id: i64,
) -> Result<Vec<Document>, String> {
    let db = state.lock().unwrap();
    db.get_user_documents(user_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_template_by_type(
    state: State<'_, Mutex<DatabaseOperations>>,
    template_type: String,
) -> Result<DocumentTemplate, String> {
    let db = state.lock().unwrap();
    db.get_template_by_type(&template_type).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_user_by_email(
    email: String,
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<User, AppError> {
    db.get_user_by_email(&email)
        .await
        .map_err(|e| AppError::Database(e))
}

#[tauri::command]
pub async fn create_user(
    email: String,
    password: String,
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<User, AppError> {
    // TODO: Hash password before storing
    db.create_user(&email, &password)
        .await
        .map_err(|e| AppError::Database(e))
}

#[tauri::command]
pub async fn get_jobs(
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<Vec<Job>, AppError> {
    db.get_jobs().await
}

#[tauri::command]
pub async fn create_document(
    user_id: i64,
    title: String,
    content: String,
    document_type: String,
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<Document, AppError> {
    db.create_document(user_id, &title, &content, &document_type).await
}

#[tauri::command]
pub async fn get_document_templates(
    db: State<'_, Arc<DatabaseOperations>>,
) -> Result<Vec<DocumentTemplate>, AppError> {
    db.get_document_templates().await
} 