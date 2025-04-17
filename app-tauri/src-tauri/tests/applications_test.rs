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
        let job_id = Uuid::new_v4();
        
        let application = Application {
            id: Uuid::new_v4(),
            user_id,
            job_id,
            status: "applied".to_string(),
            applied_at: Utc::now(),
            notes: Some("Test application".to_string()),
            cv_path: Some("/path/to/cv.pdf".to_string()),
            cover_letter_path: Some("/path/to/cover_letter.pdf".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = create_application(db, application).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_application() {
        let db = TauriSql::default();
        let application_id = Uuid::new_v4();
        
        let result = get_application(db, application_id).await;
        assert!(result.is_err()); // Should fail as application doesn't exist
    }

    #[tokio::test]
    async fn test_update_application() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        let job_id = Uuid::new_v4();
        
        let application = Application {
            id: Uuid::new_v4(),
            user_id,
            job_id,
            status: "interview".to_string(),
            applied_at: Utc::now(),
            notes: Some("Updated application".to_string()),
            cv_path: Some("/path/to/updated_cv.pdf".to_string()),
            cover_letter_path: Some("/path/to/updated_cover_letter.pdf".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = update_application(db, application).await;
        assert!(result.is_err()); // Should fail as application doesn't exist
    }

    #[tokio::test]
    async fn test_delete_application() {
        let db = TauriSql::default();
        let application_id = Uuid::new_v4();
        
        let result = delete_application(db, application_id).await;
        assert!(result.is_err()); // Should fail as application doesn't exist
    }

    #[tokio::test]
    async fn test_list_applications() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = list_applications(db, user_id).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }

    #[tokio::test]
    async fn test_get_applications_by_job() {
        let db = TauriSql::default();
        let job_id = Uuid::new_v4();
        
        let result = get_applications_by_job(db, job_id).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }

    #[tokio::test]
    async fn test_get_applications_by_status() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = get_applications_by_status(db, user_id, "applied".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }
} 