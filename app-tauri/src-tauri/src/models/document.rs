use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::models::types::DocumentType;
use crate::types::{DbPool, DbResult, DbRow, TauriSql};
use crate::models::traits::{DatabaseModel, FromRow};

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
#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub file_path: String,
    pub document_type: String,
    pub created_at: String,
    pub updated_at: String,
}

impl FromRow for Document {
    fn from_row(row: DbRow) -> DbResult<Self> {
        Ok(Self {
            id: row.get("id")?,
            user_id: row.get("user_id")?,
            name: row.get("name")?,
            file_path: row.get("file_path")?,
            document_type: row.get("document_type")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    }
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

impl DatabaseModel for Document {
    fn table_name() -> &'static str {
        "documents"
    }

    async fn create(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            INSERT INTO documents (
                id, user_id, name, file_path, document_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &model.id.to_string(),
                &model.user_id.to_string(),
                &model.name,
                &model.file_path,
                &model.document_type,
                &model.created_at,
                &model.updated_at,
            ],
        )
        .await?;
        Ok(())
    }

    async fn find_by_id(pool: &DbPool, id: &str) -> DbResult<Option<Self>> {
        let uuid = Uuid::parse_str(id)?;
        let row = pool
            .fetch_one(
                r#"
                SELECT * FROM documents WHERE id = ?
                "#,
                &[&uuid.to_string()],
            )
            .await?;
        Ok(Some(Self::from_row(row)?))
    }

    async fn update(pool: &DbPool, model: &Self) -> DbResult<()> {
        pool.execute(
            r#"
            UPDATE documents SET
                user_id = ?,
                name = ?,
                file_path = ?,
                document_type = ?,
                updated_at = ?
            WHERE id = ?
            "#,
            &[
                &model.user_id.to_string(),
                &model.name,
                &model.file_path,
                &model.document_type,
                &model.updated_at,
                &model.id.to_string(),
            ],
        )
        .await?;
        Ok(())
    }

    async fn delete(pool: &DbPool, id: &str) -> DbResult<()> {
        let uuid = Uuid::parse_str(id)?;
        pool.execute(
            r#"
            DELETE FROM documents WHERE id = ?
            "#,
            &[&uuid.to_string()],
        )
        .await?;
        Ok(())
    }
}

impl Document {
    pub async fn find_by_user_id(pool: &DbPool, user_id: &str) -> DbResult<Vec<Self>> {
        let uuid = Uuid::parse_str(user_id)?;
        let rows = pool
            .fetch_all(
                r#"
                SELECT * FROM documents WHERE user_id = ?
                "#,
                &[&uuid.to_string()],
            )
            .await?;
        Ok(rows.into_iter().map(|row| Self::from_row(row).unwrap()).collect())
    }
} 