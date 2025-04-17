use crate::commands::application::*;
use tauri_plugin_sql::TauriSql;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    // Helper pour créer une application de test
    fn create_test_application(id: i32, user_id: i32, job_id: i32, status: ApplicationStatus) -> Application {
        Application {
            id,
            user_id,
            job_id,
            status,
            applied_date: Utc::now(),
            notes: Some(format!("Test application {}", id)),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[tokio::test]
    async fn test_create_application() {
        let db = TauriSql::default();
        let application = create_test_application(1, 1, 1, ApplicationStatus::Applied);
        
        let result = create_application(db, application).await;
        assert!(result.is_ok());
        
        let created_application = result.unwrap();
        assert_eq!(created_application.user_id, 1);
        assert_eq!(created_application.job_id, 1);
        assert_eq!(created_application.status, ApplicationStatus::Applied);
        assert!(created_application.notes.is_some());
    }

    #[tokio::test]
    async fn test_get_applications() {
        let db = TauriSql::default();
        
        // Créer plusieurs applications
        let app1 = create_test_application(1, 1, 1, ApplicationStatus::Applied);
        let app2 = create_test_application(2, 1, 2, ApplicationStatus::Interview);
        
        create_application(db.clone(), app1).await.unwrap();
        create_application(db.clone(), app2).await.unwrap();
        
        let result = get_applications(db, 1).await;
        assert!(result.is_ok());
        
        let applications = result.unwrap();
        assert_eq!(applications.len(), 2);
        assert!(applications.iter().any(|a| a.status == ApplicationStatus::Applied));
        assert!(applications.iter().any(|a| a.status == ApplicationStatus::Interview));
    }

    #[tokio::test]
    async fn test_update_application_status() {
        let db = TauriSql::default();
        
        // Créer une application initiale
        let application = create_test_application(1, 1, 1, ApplicationStatus::Applied);
        create_application(db.clone(), application).await.unwrap();
        
        // Mettre à jour le statut
        let result = update_application_status(db, 1, ApplicationStatus::Interview).await;
        assert!(result.is_ok());
        
        // Vérifier que le statut a été mis à jour
        let applications = get_applications(db, 1).await.unwrap();
        let updated_app = applications.iter().find(|a| a.id == 1).unwrap();
        assert_eq!(updated_app.status, ApplicationStatus::Interview);
    }

    #[tokio::test]
    async fn test_delete_application() {
        let db = TauriSql::default();
        
        // Créer une application
        let application = create_test_application(1, 1, 1, ApplicationStatus::Applied);
        create_application(db.clone(), application).await.unwrap();
        
        // Supprimer l'application
        let result = delete_application(db.clone(), 1).await;
        assert!(result.is_ok());
        
        // Vérifier que l'application a été supprimée
        let applications = get_applications(db, 1).await.unwrap();
        assert!(applications.is_empty());
    }

    #[tokio::test]
    async fn test_application_not_found() {
        let db = TauriSql::default();
        
        // Tenter de mettre à jour une application inexistante
        let result = update_application_status(db.clone(), 999, ApplicationStatus::Interview).await;
        assert!(result.is_err());
        
        // Tenter de supprimer une application inexistante
        let result = delete_application(db, 999).await;
        assert!(result.is_err());
    }
} 