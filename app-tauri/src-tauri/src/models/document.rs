use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use crate::models::types::DocumentType;

/// Représente un document dans le système
/// 
/// # Fields
/// * `id` - Identifiant unique du document
/// * `user_id` - Identifiant de l'utilisateur propriétaire
/// * `name` - Nom du document
/// * `document_type` - Type de document (CV, lettre de motivation, etc.)
/// * `size` - Taille du document en octets
/// * `created_at` - Date de création
/// * `updated_at` - Date de dernière mise à jour
/// * `file_path` - Chemin vers le fichier (optionnel)
/// * `description` - Description du document (optionnelle)
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub document_type: DocumentType,
    pub size: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub file_path: Option<String>,
    pub description: Option<String>,
}

/// Structure pour la création d'un nouveau document
/// 
/// # Fields
/// * `user_id` - Identifiant de l'utilisateur propriétaire
/// * `name` - Nom du document
/// * `document_type` - Type de document
/// * `size` - Taille du document en octets
/// * `file_path` - Chemin vers le fichier (optionnel)
/// * `description` - Description du document (optionnelle)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewDocument {
    pub user_id: String,
    pub name: String,
    pub document_type: DocumentType,
    pub size: i64,
    pub file_path: Option<String>,
    pub description: Option<String>,
}

/// Structure pour la mise à jour d'un document existant
/// 
/// # Fields
/// * `name` - Nouveau nom (optionnel)
/// * `document_type` - Nouveau type (optionnel)
/// * `size` - Nouvelle taille (optionnelle)
/// * `file_path` - Nouveau chemin (optionnel)
/// * `description` - Nouvelle description (optionnelle)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDocument {
    pub name: Option<String>,
    pub document_type: Option<DocumentType>,
    pub size: Option<i64>,
    pub file_path: Option<String>,
    pub description: Option<String>,
} 