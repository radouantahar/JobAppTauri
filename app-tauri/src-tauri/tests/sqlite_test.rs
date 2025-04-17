use crate::commands::auth::*;
use crate::commands::user_profile::*;
use crate::commands::jobs::*;
use crate::commands::applications::*;
use crate::commands::documents::*;
use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_auth_flow() {
        let db = TauriSql::default();
        let email = "test@example.com";
        let password = "password123";
        
        // Register
        let result = register(db, email.to_string(), password.to_string()).await;
        assert!(result.is_ok());
        let user_id = result.unwrap();

        // Login
        let result = login(db, email.to_string(), password.to_string()).await;
        assert!(result.is_ok());
        let session = result.unwrap();
        assert_eq!(session.user_id, user_id);

        // Get current user
        let result = get_current_user(db, session.token).await;
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.id, user_id);
        assert_eq!(user.email, email);

        // Logout
        let result = logout(db, session.token).await;
        assert!(result.is_ok());

        // Try to get current user after logout
        let result = get_current_user(db, session.token).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_user_profile_flow() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        // Create profile
        let profile = UserProfile {
            user_id,
            name: Some("Test User".to_string()),
            phone: Some("+33612345678".to_string()),
            location: Some("Paris".to_string()),
            primary_home: Some("Paris".to_string()),
            secondary_home: Some("Lyon".to_string()),
            skills: Some(vec!["Rust".to_string(), "Python".to_string()]),
            experience: Some("5 years".to_string()),
            education: Some("Master's degree".to_string()),
            cv_path: Some("/path/to/cv.pdf".to_string()),
            cv_last_updated: Some(Utc::now()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = update_user_profile(db, profile).await;
        assert!(result.is_ok());

        // Get profile
        let result = get_user_profile(db, user_id).await;
        assert!(result.is_ok());
        let profile = result.unwrap();
        assert_eq!(profile.user_id, user_id);
        assert_eq!(profile.name.unwrap(), "Test User");
    }

    #[tokio::test]
    async fn test_job_flow() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        // Create job
        let job = Job {
            id: Uuid::new_v4(),
            user_id,
            title: "Test Job".to_string(),
            company: "Test Company".to_string(),
            location: "Paris".to_string(),
            job_type: "CDI".to_string(),
            posted_at: Utc::now(),
            experience_level: "mid".to_string(),
            salary_min: Some(40000),
            salary_max: Some(60000),
            salary_currency: Some("EUR".to_string()),
            salary_period: Some("year".to_string()),
            description: "Test description".to_string(),
            url: Some("https://example.com".to_string()),
            remote: false,
            skills: vec!["React".to_string(), "TypeScript".to_string()],
            source: "linkedin".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = create_job(db, job).await;
        assert!(result.is_ok());
        let job_id = result.unwrap();

        // Get job
        let result = get_job(db, job_id).await;
        assert!(result.is_ok());
        let job = result.unwrap();
        assert_eq!(job.id, job_id);
        assert_eq!(job.title, "Test Job");

        // List jobs
        let result = list_jobs(db, user_id).await;
        assert!(result.is_ok());
        let jobs = result.unwrap();
        assert_eq!(jobs.len(), 1);
        assert_eq!(jobs[0].id, job_id);

        // Search jobs
        let result = search_jobs(db, user_id, "Test".to_string()).await;
        assert!(result.is_ok());
        let jobs = result.unwrap();
        assert_eq!(jobs.len(), 1);
        assert_eq!(jobs[0].id, job_id);
    }

    #[tokio::test]
    async fn test_application_flow() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        let job_id = Uuid::new_v4();
        
        // Create application
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
        let application_id = result.unwrap();

        // Get application
        let result = get_application(db, application_id).await;
        assert!(result.is_ok());
        let application = result.unwrap();
        assert_eq!(application.id, application_id);
        assert_eq!(application.status, "applied");

        // List applications
        let result = list_applications(db, user_id).await;
        assert!(result.is_ok());
        let applications = result.unwrap();
        assert_eq!(applications.len(), 1);
        assert_eq!(applications[0].id, application_id);

        // Get applications by job
        let result = get_applications_by_job(db, job_id).await;
        assert!(result.is_ok());
        let applications = result.unwrap();
        assert_eq!(applications.len(), 1);
        assert_eq!(applications[0].id, application_id);

        // Get applications by status
        let result = get_applications_by_status(db, user_id, "applied".to_string()).await;
        assert!(result.is_ok());
        let applications = result.unwrap();
        assert_eq!(applications.len(), 1);
        assert_eq!(applications[0].id, application_id);
    }

    #[tokio::test]
    async fn test_document_flow() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        // Create document
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
        let document_id = result.unwrap();

        // Get document
        let result = get_document(db, document_id).await;
        assert!(result.is_ok());
        let document = result.unwrap();
        assert_eq!(document.id, document_id);
        assert_eq!(document.name, "Test Document");

        // List documents
        let result = list_documents(db, user_id).await;
        assert!(result.is_ok());
        let documents = result.unwrap();
        assert_eq!(documents.len(), 1);
        assert_eq!(documents[0].id, document_id);

        // Get documents by type
        let result = get_documents_by_type(db, user_id, "cv".to_string()).await;
        assert!(result.is_ok());
        let documents = result.unwrap();
        assert_eq!(documents.len(), 1);
        assert_eq!(documents[0].id, document_id);
    }
} 