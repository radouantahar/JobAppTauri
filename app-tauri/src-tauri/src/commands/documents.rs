use crate::models::sql_models::Document;
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;

use crate::error::Error;
use crate::models::AppState;
use tauri_plugin_sql::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentTemplate {
    pub id: Uuid,
    pub name: String,
    pub content: String,
    pub document_type: String,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[tauri::command]
pub async fn get_documents(db: State<'_, TauriSql>) -> Result<Vec<Document>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let documents: Vec<Document> = sqlx::query_as!(
        Document,
        r#"
        SELECT * FROM documents ORDER BY created_at DESC
        "#
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(documents)
}

#[tauri::command]
pub async fn create_document(
    name: String,
    content: String,
    document_type: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // Créer le document
    let document = Document {
        id: Uuid::new_v4(),
        name,
        content,
        document_type,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Sauvegarder le document
    document.create(&pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_document(
    document_id: Uuid,
    pool: State<'_, SqlitePool>,
) -> Result<Option<Document>, String> {
    // Récupérer le document
    let document = Document::find_by_id(&pool, document_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(document)
}

#[tauri::command]
pub async fn update_document(
    document_id: Uuid,
    name: String,
    content: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE documents
        SET name = ?, content = ?, updated_at = ?
        WHERE id = ?
        "#,
        name,
        content,
        Utc::now(),
        document_id.to_string()
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_document(
    document_id: Uuid,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        DELETE FROM documents
        WHERE id = ?
        "#,
        document_id.to_string()
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_document_templates(db: State<'_, TauriSql>) -> Result<Vec<DocumentTemplate>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let templates: Vec<DocumentTemplate> = sqlx::query_as!(
        DocumentTemplate,
        r#"
        SELECT * FROM document_templates ORDER BY name
        "#
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(templates)
}

#[tauri::command]
pub async fn upload_document(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    name: String,
    document_type: String,
    size: i64,
    file_path: String,
) -> Result<Document, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    sqlx::query!(
        r#"
        INSERT INTO documents (id, user_id, name, document_type, size, file_path, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
        id,
        user_id,
        name,
        document_type,
        size,
        file_path,
        now,
        now
    )
    .execute(&conn)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(Document {
        id,
        user_id,
        name,
        document_type,
        size,
        created_at: now,
        updated_at: now,
        file_path: Some(file_path),
        description: None,
    })
}

#[tauri::command]
pub async fn list_documents(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<Document>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let documents: Vec<Document> = sqlx::query_as!(
        Document,
        r#"
        SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(documents)
}

#[tauri::command]
pub async fn get_documents_by_type(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    document_type: String,
) -> Result<Vec<Document>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let documents: Vec<Document> = sqlx::query_as!(
        Document,
        r#"
        SELECT * FROM documents 
        WHERE user_id = $1 AND document_type = $2 
        ORDER BY created_at DESC
        "#,
        user_id,
        document_type
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(documents)
} 