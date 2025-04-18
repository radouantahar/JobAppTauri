use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;
use thiserror::Error;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::types::{DbPool, DbResult, DbRow};

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("Invalid email format")]
    InvalidEmail,
    #[error("Invalid phone number format")]
    InvalidPhone,
    #[error("Invalid document type")]
    InvalidDocumentType,
}

/// Type pour les identifiants
pub type Id = Uuid;

/// Type personnalisé pour les emails avec validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Email(String);

impl Email {
    pub fn new(email: String) -> Result<Self, String> {
        if email.contains('@') {
            Ok(Self(email))
        } else {
            Err("Invalid email format".to_string())
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl FromStr for Email {
    type Err = ValidationError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Email::new(s.to_string())
    }
}

/// Type personnalisé pour les numéros de téléphone avec validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhoneNumber(String);

impl PhoneNumber {
    pub fn new(phone: String) -> Result<Self, ValidationError> {
        // Validation simple - peut être améliorée selon les besoins
        if phone.chars().all(|c| c.is_digit(10) || c == '+' || c == ' ' || c == '-') {
            Ok(PhoneNumber(phone))
        } else {
            Err(ValidationError::InvalidPhone)
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for PhoneNumber {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Type personnalisé pour les types de documents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentType {
    CV,
    CoverLetter,
    Portfolio,
    Reference,
    Other(String),
}

impl DocumentType {
    pub fn new(doc_type: &str) -> Result<Self, ValidationError> {
        match doc_type.to_lowercase().as_str() {
            "cv" => Ok(DocumentType::CV),
            "cover_letter" => Ok(DocumentType::CoverLetter),
            "portfolio" => Ok(DocumentType::Portfolio),
            "reference" => Ok(DocumentType::Reference),
            _ => Ok(DocumentType::Other(doc_type.to_string())),
        }
    }
}

impl fmt::Display for DocumentType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DocumentType::CV => write!(f, "CV"),
            DocumentType::CoverLetter => write!(f, "Cover Letter"),
            DocumentType::Portfolio => write!(f, "Portfolio"),
            DocumentType::Reference => write!(f, "Reference"),
            DocumentType::Other(s) => write!(f, "{}", s),
        }
    }
}

/// Trait pour les modèles avec timestamps
pub trait Timestamped {
    fn created_at(&self) -> &DateTime<Utc>;
    fn updated_at(&self) -> &DateTime<Utc>;
}

/// Trait pour les modèles avec identifiant
pub trait Identifiable {
    fn id(&self) -> &Id;
}

/// Trait pour les modèles avec propriétaire
pub trait Owned {
    fn user_id(&self) -> &Id;
}

/// Trait pour la conversion depuis/sur la base de données
pub trait DatabaseModel: Sized + Identifiable {
    fn table_name() -> &'static str;
    
    async fn create(pool: &DbPool, model: &Self) -> DbResult<()>;
    async fn find_by_id(pool: &DbPool, id: &Id) -> DbResult<Option<Self>>;
    async fn update(pool: &DbPool, model: &Self) -> DbResult<()>;
    async fn delete(pool: &DbPool, id: &Id) -> DbResult<()>;
    fn from_row(row: DbRow) -> DbResult<Self>;
} 