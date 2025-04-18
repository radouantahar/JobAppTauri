use crate::commands::applications::*;
use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_application() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = create_application(
            user_id,
            "Test Company".to_string(),
            "Software Engineer".to_string(),
            "applied".to_string(),
            Some("Test application".to_string()),
            db,
        ).await;
        
        assert!(result.is_ok());
        let application = result.unwrap();
        assert_eq!(application.company_name, "Test Company");
        assert_eq!(application.position, "Software Engineer");
        assert_eq!(application.status, "applied");
        assert_eq!(application.notes, Some("Test application".to_string()));
    }

    #[tokio::test]
    async fn test_get_application() {
        let db = TauriSql::default();
        let application_id = Uuid::new_v4();
        
        let result = get_application(application_id, db).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none()); // Should return None as application doesn't exist
    }

    #[tokio::test]
    async fn test_update_application() {
        let db = TauriSql::default();
        let application_id = Uuid::new_v4();
        
        let result = update_application(
            application_id,
            "Updated Company".to_string(),
            "Senior Engineer".to_string(),
            "interview".to_string(),
            Some("Updated application".to_string()),
            db,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_delete_application() {
        let db = TauriSql::default();
        let application_id = Uuid::new_v4();
        
        let result = delete_application(application_id, db).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_user_applications() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = get_user_applications(user_id, db).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }

    #[tokio::test]
    async fn test_search_applications() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = search_applications(user_id, "test".to_string(), db).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }
} 