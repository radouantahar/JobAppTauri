use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value;
use crate::models::types::{PhoneNumber, DocumentType};

/// Représente le profil d'un utilisateur
/// 
/// # Fields
/// * `id` - Identifiant unique du profil (INTEGER)
/// * `user_id` - Identifiant de l'utilisateur associé
/// * `full_name` - Nom complet de l'utilisateur (optionnel)
/// * `current_position` - Poste actuel (optionnel)
/// * `summary` - Résumé professionnel (optionnel)
/// * `skills` - Compétences au format JSON
/// * `experiences` - Expériences professionnelles au format JSON
/// * `education` - Formation au format JSON
/// * `languages` - Langues parlées au format JSON
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: i64,
    pub user_id: i64,
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: Value,
    pub experiences: Value,
    pub education: Value,
    pub languages: Value,
}

/// Structure pour la création d'un nouveau profil utilisateur
/// 
/// # Fields
/// * `user_id` - Identifiant de l'utilisateur associé
/// * `full_name` - Nom complet de l'utilisateur (optionnel)
/// * `current_position` - Poste actuel (optionnel)
/// * `summary` - Résumé professionnel (optionnel)
/// * `skills` - Compétences au format JSON
/// * `experiences` - Expériences professionnelles au format JSON
/// * `education` - Formation au format JSON
/// * `languages` - Langues parlées au format JSON
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUserProfile {
    pub user_id: i64,
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: Value,
    pub experiences: Value,
    pub education: Value,
    pub languages: Value,
}

/// Structure pour la mise à jour d'un profil utilisateur
/// 
/// # Fields
/// * `full_name` - Nouveau nom complet (optionnel)
/// * `current_position` - Nouveau poste actuel (optionnel)
/// * `summary` - Nouveau résumé professionnel (optionnel)
/// * `skills` - Nouvelles compétences au format JSON (optionnel)
/// * `experiences` - Nouvelles expériences au format JSON (optionnel)
/// * `education` - Nouvelle formation au format JSON (optionnel)
/// * `languages` - Nouvelles langues au format JSON (optionnel)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserProfile {
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: Option<Value>,
    pub experiences: Option<Value>,
    pub education: Option<Value>,
    pub languages: Option<Value>,
} 