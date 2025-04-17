use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value;
use crate::models::types::Email;

/// Représente un utilisateur dans le système
/// 
/// # Fields
/// * `id` - Identifiant unique de l'utilisateur (INTEGER)
/// * `username` - Nom d'utilisateur unique
/// * `email` - Adresse email de l'utilisateur
/// * `password_hash` - Hash du mot de passe de l'utilisateur
/// * `created_at` - Date de création du compte
/// * `last_login` - Date de dernière connexion (optionnelle)
/// * `preferences` - Préférences utilisateur au format JSON
/// * `settings` - Paramètres utilisateur au format JSON
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: Email,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub preferences: Value,
    pub settings: Value,
}

/// Structure pour la création d'un nouvel utilisateur
/// 
/// # Fields
/// * `username` - Nom d'utilisateur unique
/// * `email` - Adresse email du nouvel utilisateur
/// * `password` - Mot de passe en clair (sera hashé avant stockage)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUser {
    pub username: String,
    pub email: Email,
    pub password: String,
}

/// Structure pour la mise à jour d'un utilisateur existant
/// 
/// # Fields
/// * `username` - Nouveau nom d'utilisateur (optionnel)
/// * `email` - Nouvelle adresse email (optionnelle)
/// * `password` - Nouveau mot de passe (optionnel)
/// * `preferences` - Nouvelles préférences (optionnelles)
/// * `settings` - Nouveaux paramètres (optionnels)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUser {
    pub username: Option<String>,
    pub email: Option<Email>,
    pub password: Option<String>,
    pub preferences: Option<Value>,
    pub settings: Option<Value>,
} 