use crate::models::application::Application;
use tauri::State;
use tauri_plugin_sql::TauriSql;
use chrono::Utc;
use uuid::Uuid;

/// Crée une nouvelle candidature
#[tauri::command]
pub async fn create_application(
    user_id: String,
    job_id: String,
    status: String,
    notes: Option<String>,
    cv_path: Option<String>,
    db: State<'_, TauriSql>,
) -> Result<Application, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let application = Application {
        id: Uuid::new_v4().to_string(),
        user_id,
        job_id,
        status,
        notes,
        cv_path,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    application.create(&conn).await.map_err(|e| e.to_string())?;
    Ok(application)
}

/// Récupère une candidature par son ID
#[tauri::command]
pub async fn get_application(
    application_id: String,
    db: State<'_, TauriSql>,
) -> Result<Option<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Application::find_by_id(&conn, &application_id).await.map_err(|e| e.to_string())
}

/// Met à jour une candidature existante
#[tauri::command]
pub async fn update_application(
    application_id: String,
    status: String,
    notes: Option<String>,
    cv_path: Option<String>,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut application = Application::find_by_id(&conn, &application_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Application not found".to_string())?;

    application.status = status;
    application.notes = notes;
    application.cv_path = cv_path;
    application.updated_at = Utc::now();

    application.update(&conn).await.map_err(|e| e.to_string())
}

/// Supprime une candidature
#[tauri::command]
pub async fn delete_application(
    application_id: String,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Application::delete(&conn, &application_id).await.map_err(|e| e.to_string())
}

/// Récupère toutes les candidatures d'un utilisateur
#[tauri::command]
pub async fn get_user_applications(
    user_id: String,
    db: State<'_, TauriSql>,
) -> Result<Vec<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Application::find_by_user_id(&conn, &user_id).await.map_err(|e| e.to_string())
}

/// Recherche des candidatures par mot-clé
#[tauri::command]
pub async fn search_applications(
    user_id: String,
    query: String,
    db: State<'_, TauriSql>,
) -> Result<Vec<Application>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    Application::search(&conn, &user_id, &query).await.map_err(|e| e.to_string())
} 