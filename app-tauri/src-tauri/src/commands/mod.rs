use crate::models::{UserProfile, UserLocations, CVInfo, UserPreferences, JobPreferences};
use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri_plugin_sql::TauriSql;

pub mod auth;
pub mod documents;
pub mod applications;
pub mod search;

pub use auth::{register, login, logout, get_current_user};
pub use documents::{get_documents, create_document, update_document, delete_document, get_document_templates, upload_document, get_user_documents};
pub use applications::{create_application, get_application, update_application_status, add_application_stage, add_application_note, add_application_document};
pub use search::{search_jobs, get_search_preferences, update_search_preferences, get_job_details};

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

// Structure pour stocker l'état de l'application
#[allow(dead_code)]
pub struct AppState {
    pub python_path: Mutex<String>,
    pub app_path: Mutex<String>,
}

// Commande pour rechercher des offres d'emploi
#[allow(dead_code)]
#[tauri::command]
pub async fn search_jobs(
    _state: State<'_, AppState>,
    _criteria: SearchCriteria,
) -> Result<Vec<Job>, String> {
    // Implémentation de la recherche d'offres d'emploi
    // TODO: Implémenter la logique de recherche
    Ok(vec![])
}

// Commande pour obtenir le profil utilisateur
#[tauri::command]
pub async fn get_user_profile(db: State<'_, TauriSql>) -> Result<UserProfile, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let user: UserProfile = sqlx::query_as!(
        UserProfile,
        r#"
        SELECT * FROM user_profiles WHERE id = 1
        "#
    )
    .fetch_one(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(user)
}

// Commande pour mettre à jour le profil utilisateur
#[tauri::command]
pub async fn update_user_profile(
    db: State<'_, TauriSql>,
    profile: UserProfile,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    sqlx::query!(
        r#"
        UPDATE user_profiles
        SET name = $1, phone = $2, location = $3, primary_home = $4,
            secondary_home = $5, skills = $6, experience = $7,
            education = $8, cv_path = $9, cv_last_updated = $10,
            updated_at = $11
        WHERE id = $12
        "#,
        profile.name,
        profile.phone,
        profile.location,
        profile.primary_home,
        profile.secondary_home,
        profile.skills,
        profile.experience,
        profile.education,
        profile.cv_path,
        profile.cv_last_updated,
        chrono::Utc::now(),
        profile.id
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Commande pour obtenir les colonnes du Kanban
#[tauri::command]
pub async fn get_kanban_columns(
    _state: State<'_, AppState>,
) -> Result<Vec<KanbanColumn>, String> {
    // Implémentation de la récupération des colonnes du Kanban
    // TODO: Implémenter la logique de récupération
    Ok(vec![])
}

// Commande pour déplacer une carte dans le Kanban
#[tauri::command]
pub async fn move_kanban_card(
    _state: State<'_, AppState>,
    _card_id: i64,
    _to_column_id: i64,
    _position: i32,
) -> Result<bool, String> {
    // Implémentation du déplacement de carte
    // TODO: Implémenter la logique de déplacement
    Ok(true)
}

// Commande pour obtenir les préférences de recherche
#[tauri::command]
pub async fn get_search_preferences(
    _state: State<'_, AppState>,
) -> Result<Vec<SearchPreference>, String> {
    // Implémentation de la récupération des préférences de recherche
    // TODO: Implémenter la logique de récupération
    Ok(vec![])
}

// Commande pour mettre à jour les préférences de recherche
#[allow(dead_code)]
#[tauri::command]
pub async fn update_search_preferences(
    _state: State<'_, AppState>,
    _preferences: SearchPreference,
) -> Result<bool, String> {
    // Implémentation de la mise à jour des préférences de recherche
    // TODO: Implémenter la logique de mise à jour
    Ok(true)
}

// Commande pour obtenir les fournisseurs LLM
#[allow(dead_code)]
#[tauri::command]
pub async fn get_llm_providers(
    _state: State<'_, AppState>,
) -> Result<Vec<LLMProvider>, String> {
    // Implémentation de la récupération des fournisseurs LLM
    // TODO: Implémenter la logique de récupération
    Ok(vec![])
}

// Commande pour mettre à jour un fournisseur LLM
#[allow(dead_code)]
#[tauri::command]
pub async fn update_llm_provider(
    _state: State<'_, AppState>,
    _provider: LLMProvider,
) -> Result<bool, String> {
    // Implémentation de la mise à jour du fournisseur LLM
    // TODO: Implémenter la logique de mise à jour
    Ok(true)
}

// Commande pour générer des suggestions de recherche
#[allow(dead_code)]
#[tauri::command]
pub async fn generate_search_suggestions(
    _state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    // Implémentation de la génération de suggestions
    // TODO: Implémenter la logique de génération
    Ok(vec![])
}

// Commande pour obtenir les templates de documents
#[allow(dead_code)]
#[tauri::command]
pub async fn get_document_templates(
    _state: State<'_, AppState>,
) -> Result<Vec<DocumentTemplate>, String> {
    // Implémentation de la récupération des templates
    // TODO: Implémenter la logique de récupération
    Ok(vec![])
}

// Commande pour générer un document
#[allow(dead_code)]
#[tauri::command]
pub async fn generate_document(
    _state: State<'_, AppState>,
    _job_id: i64,
    _template_id: i64,
    _document_type: String,
) -> Result<GeneratedDocument, String> {
    // Implémentation de la génération de document
    // TODO: Implémenter la logique de génération
    Ok(GeneratedDocument {
        id: 1,
        job_id: _job_id,
        template_id: _template_id,
        document_type: _document_type,
        content: "Test content".to_string(),
        created_at: "2024-04-14".to_string(),
        version: None,
        feedback: None,
    })
}

// Commande pour obtenir les statistiques d'emploi
#[allow(dead_code)]
#[tauri::command]
pub async fn get_job_stats(
    _state: State<'_, AppState>,
) -> Result<JobStats, String> {
    // Implémentation de la récupération des statistiques
    // TODO: Implémenter la logique de récupération
    Ok(JobStats {
        total_jobs: 0,
        trend_data: TrendData {
            labels: vec![],
            values: vec![],
        },
        source_distribution: DistributionData {
            labels: vec![],
            values: vec![],
        },
    })
}

// Commande pour obtenir les statistiques de candidature
#[allow(dead_code)]
#[tauri::command]
pub async fn get_application_stats(
    _state: State<'_, AppState>,
) -> Result<ApplicationStats, String> {
    // Implémentation de la récupération des statistiques
    // TODO: Implémenter la logique de récupération
    Ok(ApplicationStats {
        total_applications: 0,
        total_interviews: 0,
        total_offers: 0,
        success_rate: 0.0,
    })
} 