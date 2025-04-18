use crate::models::sql_models::DocumentModel;
use tauri::State;
use tauri_plugin_sql::TauriSql;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;

use crate::error::Error;

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
pub async fn get_documents(db: State<'_, TauriSql>) -> Result<Vec<DocumentModel>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM documents ORDER BY created_at DESC",
        &[]
    ).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        result.push(DocumentModel::from(row));
    }

    Ok(result)
}

#[tauri::command]
pub async fn create_document(
    name: String,
    content: String,
    document_type: String,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let id = Uuid::new_v4();
    let now = Utc::now().to_string();

    conn.execute(
        r#"
        INSERT INTO documents (id, name, content, document_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
        &[
            &id.to_string(),
            &name,
            &content,
            &document_type,
            &now,
            &now
        ]
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_document(
    document_id: Uuid,
    db: State<'_, TauriSql>,
) -> Result<Option<DocumentModel>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM documents WHERE id = ?",
        &[&document_id.to_string()]
    ).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(DocumentModel::from(row)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn update_document(
    document_id: Uuid,
    name: String,
    content: String,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        UPDATE documents
        SET name = ?, content = ?, updated_at = ?
        WHERE id = ?
        "#,
        &[
            &name,
            &content,
            &now,
            &document_id.to_string()
        ]
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_document(
    document_id: Uuid,
    db: State<'_, TauriSql>,
) -> Result<(), String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM documents WHERE id = ?",
        &[&document_id.to_string()]
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_document_templates(db: State<'_, TauriSql>) -> Result<Vec<DocumentTemplate>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM document_templates ORDER BY name",
        &[]
    ).map_err(|e| e.to_string())?;

    let mut templates = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        templates.push(DocumentTemplate {
            id: Uuid::parse_str(row.get("id")).map_err(|e| e.to_string())?,
            name: row.get("name"),
            content: row.get("content"),
            document_type: row.get("document_type"),
            created_at: chrono::DateTime::parse_from_rfc3339(row.get("created_at"))
                .map_err(|e| e.to_string())?
                .with_timezone(&Utc),
            updated_at: chrono::DateTime::parse_from_rfc3339(row.get("updated_at"))
                .map_err(|e| e.to_string())?
                .with_timezone(&Utc),
        });
    }

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
) -> Result<DocumentModel, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let id = Uuid::new_v4();
    let now = Utc::now().to_string();
    
    conn.execute(
        r#"
        INSERT INTO documents (id, user_id, name, document_type, size, file_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &id.to_string(),
            &user_id.to_string(),
            &name,
            &document_type,
            &size,
            &file_path,
            &now,
            &now
        ]
    ).map_err(|e| e.to_string())?;
    
    Ok(DocumentModel {
        id,
        user_id,
        name,
        document_type,
        size,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        file_path: Some(file_path),
        description: None,
    })
}

#[tauri::command]
pub async fn list_documents(
    db: State<'_, TauriSql>,
    user_id: Uuid,
) -> Result<Vec<DocumentModel>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC",
        &[&user_id.to_string()]
    ).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        result.push(DocumentModel::from(row));
    }

    Ok(result)
}

#[tauri::command]
pub async fn get_documents_by_type(
    db: State<'_, TauriSql>,
    user_id: Uuid,
    document_type: String,
) -> Result<Vec<DocumentModel>, String> {
    let conn = db.get("sqlite:app.db").map_err(|e| e.to_string())?;
    
    let mut rows = conn.query(
        "SELECT * FROM documents WHERE user_id = ? AND document_type = ? ORDER BY created_at DESC",
        &[&user_id.to_string(), &document_type]
    ).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        result.push(DocumentModel::from(row));
    }

    Ok(result)
} 