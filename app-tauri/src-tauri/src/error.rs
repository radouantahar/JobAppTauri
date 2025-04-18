use std::fmt;
use serde::{Serialize, Deserialize};
use tauri_plugin_sql::Error as SqlError;

#[derive(Debug, Serialize, Deserialize)]
pub enum AppError {
    Database(String),
    Auth(String),
    Validation(String),
    NotFound(String),
    Internal(String),
    IO(String),
    Network(String),
    Configuration(String),
    DatabaseError(String),
    AuthenticationError(String),
    ValidationError(String),
    BackupError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Database(msg) => write!(f, "Erreur de base de données : {}", msg),
            AppError::Auth(msg) => write!(f, "Erreur d'authentification : {}", msg),
            AppError::Validation(msg) => write!(f, "Erreur de validation : {}", msg),
            AppError::NotFound(msg) => write!(f, "Ressource non trouvée : {}", msg),
            AppError::Internal(msg) => write!(f, "Erreur interne : {}", msg),
            AppError::IO(msg) => write!(f, "Erreur I/O : {}", msg),
            AppError::Network(msg) => write!(f, "Erreur réseau : {}", msg),
            AppError::Configuration(msg) => write!(f, "Erreur de configuration : {}", msg),
            AppError::DatabaseError(msg) => write!(f, "Erreur de base de données: {}", msg),
            AppError::AuthenticationError(msg) => write!(f, "Erreur d'authentification: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Erreur de validation: {}", msg),
            AppError::BackupError(msg) => write!(f, "Erreur de backup: {}", msg),
        }
    }
}

impl From<SqlError> for AppError {
    fn from(error: SqlError) -> Self {
        AppError::Database(error.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IO(error.to_string())
    }
}

// Trait pour la validation des données
pub trait Validate {
    fn validate(&self) -> Result<(), AppError>;
}

// Fonctions utilitaires pour la validation
pub fn validate_email(email: &str) -> Result<(), AppError> {
    if !email.contains('@') || !email.contains('.') {
        return Err(AppError::Validation("Email invalide".to_string()));
    }
    Ok(())
}

pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 8 {
        return Err(AppError::Validation("Le mot de passe doit contenir au moins 8 caractères".to_string()));
    }
    Ok(())
}

pub fn validate_job_title(title: &str) -> Result<(), AppError> {
    if title.is_empty() {
        return Err(AppError::Validation("Le titre ne peut pas être vide".to_string()));
    }
    if title.len() > 200 {
        return Err(AppError::Validation("Le titre est trop long".to_string()));
    }
    Ok(())
}

pub fn validate_company_name(company: &str) -> Result<(), AppError> {
    if company.is_empty() {
        return Err(AppError::Validation("Le nom de l'entreprise ne peut pas être vide".to_string()));
    }
    if company.len() > 100 {
        return Err(AppError::Validation("Le nom de l'entreprise est trop long".to_string()));
    }
    Ok(())
}

pub fn validate_location(location: &str) -> Result<(), AppError> {
    if location.is_empty() {
        return Err(AppError::Validation("La localisation ne peut pas être vide".to_string()));
    }
    if location.len() > 100 {
        return Err(AppError::Validation("La localisation est trop longue".to_string()));
    }
    Ok(())
}

pub fn validate_salary_range(min: Option<f64>, max: Option<f64>) -> Result<(), AppError> {
    if let (Some(min_val), Some(max_val)) = (min, max) {
        if min_val > max_val {
            return Err(AppError::Validation("Le salaire minimum ne peut pas être supérieur au maximum".to_string()));
        }
    }
    Ok(())
}

pub fn validate_matching_score(score: f64) -> Result<(), AppError> {
    if score < 0.0 || score > 1.0 {
        return Err(AppError::Validation("Le score de correspondance doit être entre 0 et 1".to_string()));
    }
    Ok(())
}

// Fonction pour gérer les erreurs de manière centralisée
pub fn handle_error(error: AppError) -> String {
    match error {
        AppError::Database(msg) => {
            log::error!("Erreur de base de données : {}", msg);
            "Une erreur est survenue lors de l'accès à la base de données".to_string()
        },
        AppError::Auth(msg) => {
            log::warn!("Erreur d'authentification : {}", msg);
            "Identifiants invalides".to_string()
        },
        AppError::Validation(msg) => {
            log::warn!("Erreur de validation : {}", msg);
            msg
        },
        AppError::NotFound(msg) => {
            log::warn!("Ressource non trouvée : {}", msg);
            "La ressource demandée n'a pas été trouvée".to_string()
        },
        AppError::Internal(msg) => {
            log::error!("Erreur interne : {}", msg);
            "Une erreur inattendue est survenue".to_string()
        },
        AppError::IO(msg) => {
            log::error!("Erreur I/O : {}", msg);
            "Une erreur est survenue lors de l'accès aux fichiers".to_string()
        },
        AppError::Network(msg) => {
            log::error!("Erreur réseau : {}", msg);
            "Une erreur est survenue lors de la communication réseau".to_string()
        },
        AppError::Configuration(msg) => {
            log::error!("Erreur de configuration : {}", msg);
            "Une erreur est survenue dans la configuration de l'application".to_string()
        },
        AppError::DatabaseError(msg) => {
            log::error!("Erreur de base de données: {}", msg);
            "Une erreur est survenue lors de l'accès à la base de données".to_string()
        },
        AppError::AuthenticationError(msg) => {
            log::warn!("Erreur d'authentification: {}", msg);
            "Identifiants invalides".to_string()
        },
        AppError::ValidationError(msg) => {
            log::warn!("Erreur de validation: {}", msg);
            msg
        },
        AppError::BackupError(msg) => {
            log::error!("Erreur de backup: {}", msg);
            "Une erreur est survenue lors de la sauvegarde des données".to_string()
        },
    }
} 