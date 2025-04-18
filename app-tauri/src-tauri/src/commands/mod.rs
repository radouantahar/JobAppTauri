use crate::models::{
    Application, ApplicationStats, DocumentTemplate, GeneratedDocument, Job, JobStats,
    KanbanCard, KanbanColumn, LLMProvider, SearchPreference, User, UserProfile,
};
use tauri::State;
use crate::db::TauriSql;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{Utc, DateTime};

pub mod auth;
pub mod applications;
pub mod documents;
pub mod kanban;
pub mod search;

pub use auth::*;
pub use applications::*;
pub use documents::*;
pub use kanban::*;
pub use search::*;

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
    pub pool: std::sync::Arc<tokio::sync::Mutex<tauri_plugin_sql::SqlitePool>>,
    pub user_id: String,
}

// Commande pour obtenir le profil utilisateur
#[tauri::command]
pub async fn get_user_profile(
    db: State<'_, TauriSql>,
    user_id: String,
) -> Result<UserProfile, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM user_profiles WHERE user_id = ?",
        &[&user_id],
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(UserProfile::from(row))
    } else {
        Err("Profil utilisateur non trouvé".to_string())
    }
}

// Commande pour mettre à jour le profil utilisateur
#[tauri::command]
pub async fn update_user_profile(
    db: State<'_, TauriSql>,
    profile: UserProfile,
) -> Result<bool, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE user_profiles SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE user_id = ?",
        &[
            &profile.first_name,
            &profile.last_name,
            &profile.email,
            &profile.phone,
            &profile.user_id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

// Commande pour obtenir les fournisseurs LLM
#[tauri::command]
pub async fn get_llm_providers(
    db: State<'_, TauriSql>,
) -> Result<Vec<LLMProvider>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM llm_providers",
        &[],
    ).map_err(|e| e.to_string())?;

    let mut providers = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        providers.push(LLMProvider::from(row));
    }

    Ok(providers)
}

// Commande pour mettre à jour un fournisseur LLM
#[tauri::command]
pub async fn update_llm_provider(
    db: State<'_, TauriSql>,
    provider: LLMProvider,
) -> Result<bool, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE llm_providers SET name = ?, api_key = ?, model = ? WHERE id = ?",
        &[
            &provider.name,
            &provider.api_key,
            &provider.model,
            &provider.id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

// Commande pour générer des suggestions de recherche
#[allow(dead_code)]
#[tauri::command]
pub async fn generate_search_suggestions(
    _db: State<'_, TauriSql>,
) -> Result<Vec<String>, String> {
    // Implémentation de la génération de suggestions
    // TODO: Implémenter la logique de génération
    Ok(vec![])
}

// Commande pour générer un document
#[tauri::command]
pub async fn generate_document(
    db: State<'_, TauriSql>,
    template_id: String,
    job_id: String,
) -> Result<GeneratedDocument, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let document = GeneratedDocument {
        content: String::new(),
        template_id,
        job_id,
    };

    Ok(document)
}

// Commande pour obtenir les statistiques d'emploi
#[tauri::command]
pub async fn get_job_stats(
    db: State<'_, TauriSql>,
) -> Result<JobStats, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let stats = JobStats {
        id: Uuid::new_v4(),
        job_id: Uuid::new_v4(),
        matching_score: 0.0,
        commute_time: Some(0),
        skills_match: Some(0.0),
        experience_match: Some(0.0),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Ok(stats)
}

// Commande pour obtenir les statistiques des candidatures
#[tauri::command]
pub async fn get_application_stats(
    db: State<'_, TauriSql>,
) -> Result<ApplicationStats, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let stats = ApplicationStats {
        total_applications: 0,
        total_interviews: 0,
        total_offers: 0,
        success_rate: 0.0,
    };

    Ok(stats)
} 