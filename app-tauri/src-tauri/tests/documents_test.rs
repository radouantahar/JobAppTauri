use crate::commands::documents::*;
use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_documents() {
        let db = TauriSql::default();
        let result = get_documents(db).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_create_document() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let document = Document {
            id: Uuid::new_v4(),
            user_id,
            name: "Test Document".to_string(),
            file_path: "/path/to/document.pdf".to_string(),
            document_type: "cv".to_string(),
            content: Some("Test content".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = create_document(db, document).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_document() {
        let db = TauriSql::default();
        let document_id = Uuid::new_v4();
        
        let result = get_document(db, document_id).await;
        assert!(result.is_err()); // Should fail as document doesn't exist
    }

    #[tokio::test]
    async fn test_update_document() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let document = Document {
            id: Uuid::new_v4(),
            user_id,
            name: "Updated Document".to_string(),
            file_path: "/path/to/updated_document.pdf".to_string(),
            document_type: "cover_letter".to_string(),
            content: Some("Updated content".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = update_document(db, document).await;
        assert!(result.is_err()); // Should fail as document doesn't exist
    }

    #[tokio::test]
    async fn test_delete_document() {
        let db = TauriSql::default();
        let document_id = Uuid::new_v4();
        
        let result = delete_document(db, document_id).await;
        assert!(result.is_err()); // Should fail as document doesn't exist
    }

    #[tokio::test]
    async fn test_get_document_templates() {
        let db = TauriSql::default();
        let result = get_document_templates(db).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_list_documents() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = list_documents(db, user_id).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }

    #[tokio::test]
    async fn test_get_documents_by_type() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = get_documents_by_type(db, user_id, "cv".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }
} 