use crate::commands::jobs::*;
use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_job() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
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
    }

    #[tokio::test]
    async fn test_get_job() {
        let db = TauriSql::default();
        let job_id = Uuid::new_v4();
        
        let result = get_job(db, job_id).await;
        assert!(result.is_err()); // Should fail as job doesn't exist
    }

    #[tokio::test]
    async fn test_update_job() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let job = Job {
            id: Uuid::new_v4(),
            user_id,
            title: "Updated Job".to_string(),
            company: "Updated Company".to_string(),
            location: "Lyon".to_string(),
            job_type: "CDD".to_string(),
            posted_at: Utc::now(),
            experience_level: "senior".to_string(),
            salary_min: Some(50000),
            salary_max: Some(70000),
            salary_currency: Some("EUR".to_string()),
            salary_period: Some("year".to_string()),
            description: "Updated description".to_string(),
            url: Some("https://example.com/updated".to_string()),
            remote: true,
            skills: vec!["Rust".to_string(), "Python".to_string()],
            source: "indeed".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = update_job(db, job).await;
        assert!(result.is_err()); // Should fail as job doesn't exist
    }

    #[tokio::test]
    async fn test_delete_job() {
        let db = TauriSql::default();
        let job_id = Uuid::new_v4();
        
        let result = delete_job(db, job_id).await;
        assert!(result.is_err()); // Should fail as job doesn't exist
    }

    #[tokio::test]
    async fn test_list_jobs() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = list_jobs(db, user_id).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }

    #[tokio::test]
    async fn test_search_jobs() {
        let db = TauriSql::default();
        let user_id = Uuid::new_v4();
        
        let result = search_jobs(db, user_id, "test".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0); // Should return empty list
    }
} 