use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;
use crate::commands::statistics::{get_application_stats, get_job_stats, get_document_stats};
use crate::models::application::Application;
use crate::models::job::Job;
use crate::models::document::Document;

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_db() -> TauriSql {
        let db = TauriSql::new("sqlite:test.db").unwrap();
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer les tables nécessaires
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                status TEXT NOT NULL,
                applied_at DATETIME NOT NULL,
                notes TEXT,
                cv_path TEXT,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
            "#,
            &[],
        ).unwrap();

        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                salary_min INTEGER,
                salary_max INTEGER,
                job_type TEXT NOT NULL,
                experience_level TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                status TEXT NOT NULL,
                url TEXT
            )
            "#,
            &[],
        ).unwrap();

        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                document_type TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
            "#,
            &[],
        ).unwrap();

        db
    }

    async fn cleanup_test_db(db: &TauriSql) {
        let conn = db.get("sqlite:test.db").unwrap();
        conn.execute("DROP TABLE IF EXISTS applications", &[]).unwrap();
        conn.execute("DROP TABLE IF EXISTS jobs", &[]).unwrap();
        conn.execute("DROP TABLE IF EXISTS documents", &[]).unwrap();
    }

    #[tokio::test]
    async fn test_get_application_stats() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer des données de test
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        // Créer des jobs
        for i in 0..5 {
            let job_id = Uuid::new_v4();
            conn.execute(
                r#"
                INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                                job_type, experience_level, created_at, updated_at, status, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &job_id.to_string(),
                    &format!("Test Job {}", i),
                    &"Test Company",
                    &"Test Location",
                    &"Test Description",
                    &1000,
                    &2000,
                    &"Full-time",
                    &"Mid-level",
                    &now,
                    &now,
                    &"active",
                    &"http://test.com",
                ],
            ).unwrap();

            // Créer des applications avec différents statuts
            let status = match i {
                0 => "applied",
                1 => "interview",
                2 => "offer",
                3 => "rejected",
                _ => "applied",
            };

            let app_id = Uuid::new_v4();
            conn.execute(
                r#"
                INSERT INTO applications (id, user_id, job_id, status, applied_at, notes, cv_path, 
                                        created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &app_id.to_string(),
                    &user_id.to_string(),
                    &job_id.to_string(),
                    &status,
                    &now,
                    &"Test notes",
                    &"/path/to/cv.pdf",
                    &now,
                    &now,
                ],
            ).unwrap();
        }

        // Test récupération des statistiques
        let result = get_application_stats(&db, user_id).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_applications, 5);
        assert_eq!(stats.applied_count, 2);
        assert_eq!(stats.interview_count, 1);
        assert_eq!(stats.offer_count, 1);
        assert_eq!(stats.rejected_count, 1);

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_get_job_stats() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer des données de test
        let now = Utc::now();

        // Créer des jobs avec différents types et niveaux d'expérience
        let job_types = ["Full-time", "Part-time", "Contract"];
        let experience_levels = ["Entry", "Mid-level", "Senior"];

        for i in 0..9 {
            let job_id = Uuid::new_v4();
            let job_type = job_types[i % 3];
            let experience_level = experience_levels[i % 3];

            conn.execute(
                r#"
                INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                                job_type, experience_level, created_at, updated_at, status, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &job_id.to_string(),
                    &format!("Test Job {}", i),
                    &"Test Company",
                    &"Test Location",
                    &"Test Description",
                    &1000,
                    &2000,
                    &job_type,
                    &experience_level,
                    &now,
                    &now,
                    &"active",
                    &"http://test.com",
                ],
            ).unwrap();
        }

        // Test récupération des statistiques
        let result = get_job_stats(&db).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_jobs, 9);
        assert_eq!(stats.full_time_count, 3);
        assert_eq!(stats.part_time_count, 3);
        assert_eq!(stats.contract_count, 3);
        assert_eq!(stats.entry_level_count, 3);
        assert_eq!(stats.mid_level_count, 3);
        assert_eq!(stats.senior_level_count, 3);

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_get_document_stats() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer des données de test
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        // Créer des documents avec différents types
        let document_types = ["CV", "Cover Letter", "Portfolio", "Other"];

        for i in 0..8 {
            let doc_id = Uuid::new_v4();
            let doc_type = document_types[i % 4];

            conn.execute(
                r#"
                INSERT INTO documents (id, user_id, name, file_path, document_type, 
                                     created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &doc_id.to_string(),
                    &user_id.to_string(),
                    &format!("Test Document {}", i),
                    &format!("/path/to/doc{}.pdf", i),
                    &doc_type,
                    &now,
                    &now,
                ],
            ).unwrap();
        }

        // Test récupération des statistiques
        let result = get_document_stats(&db, user_id).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_documents, 8);
        assert_eq!(stats.cv_count, 2);
        assert_eq!(stats.cover_letter_count, 2);
        assert_eq!(stats.portfolio_count, 2);
        assert_eq!(stats.other_count, 2);

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_performance() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer un grand nombre de données pour tester les performances
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        // Créer 1000 jobs et applications
        for i in 0..1000 {
            let job_id = Uuid::new_v4();
            conn.execute(
                r#"
                INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                                job_type, experience_level, created_at, updated_at, status, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &job_id.to_string(),
                    &format!("Test Job {}", i),
                    &"Test Company",
                    &"Test Location",
                    &"Test Description",
                    &1000,
                    &2000,
                    &"Full-time",
                    &"Mid-level",
                    &now,
                    &now,
                    &"active",
                    &"http://test.com",
                ],
            ).unwrap();

            let app_id = Uuid::new_v4();
            conn.execute(
                r#"
                INSERT INTO applications (id, user_id, job_id, status, applied_at, notes, cv_path, 
                                        created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                &[
                    &app_id.to_string(),
                    &user_id.to_string(),
                    &job_id.to_string(),
                    &"applied",
                    &now,
                    &"Test notes",
                    &"/path/to/cv.pdf",
                    &now,
                    &now,
                ],
            ).unwrap();
        }

        // Mesurer le temps d'exécution
        let start = std::time::Instant::now();
        let result = get_application_stats(&db, user_id).await;
        let duration = start.elapsed();

        assert!(result.is_ok());
        assert!(duration.as_millis() < 1000, "La requête a pris trop de temps: {}ms", duration.as_millis());

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_error_handling() {
        let db = setup_test_db().await;

        // Test avec un user_id invalide
        let result = get_application_stats(&db, Uuid::new_v4()).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_applications, 0);

        // Test avec une base de données corrompue
        let conn = db.get("sqlite:test.db").unwrap();
        conn.execute("DROP TABLE applications", &[]).unwrap();

        let result = get_application_stats(&db, Uuid::new_v4()).await;
        assert!(result.is_err());

        cleanup_test_db(&db).await;
    }
} 