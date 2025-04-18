use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;
use crate::commands::favorites::{FavoriteJob, add_favorite_job, remove_favorite_job, get_favorite_jobs, is_job_favorite};
use crate::models::job::Job;

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_db() -> TauriSql {
        let db = TauriSql::new("sqlite:test.db").unwrap();
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer les tables nécessaires
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
            CREATE TABLE IF NOT EXISTS favorite_jobs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
            "#,
            &[],
        ).unwrap();

        db
    }

    async fn cleanup_test_db(db: &TauriSql) {
        let conn = db.get("sqlite:test.db").unwrap();
        conn.execute("DROP TABLE IF EXISTS favorite_jobs", &[]).unwrap();
        conn.execute("DROP TABLE IF EXISTS jobs", &[]).unwrap();
    }

    #[tokio::test]
    async fn test_add_favorite_job() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer un job de test
        let job_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        conn.execute(
            r#"
            INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                            job_type, experience_level, created_at, updated_at, status, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &job_id.to_string(),
                &"Test Job",
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

        // Test ajout d'un favori
        let result = add_favorite_job(&db, user_id, job_id).await;
        assert!(result.is_ok());
        let favorite = result.unwrap();
        assert_eq!(favorite.user_id, user_id);
        assert_eq!(favorite.job_id, job_id);

        // Test ajout d'un favori qui existe déjà
        let result = add_favorite_job(&db, user_id, job_id).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Job already in favorites");

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_remove_favorite_job() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer un job et un favori
        let job_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        conn.execute(
            r#"
            INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                            job_type, experience_level, created_at, updated_at, status, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &job_id.to_string(),
                &"Test Job",
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

        let favorite_id = Uuid::new_v4();
        conn.execute(
            r#"
            INSERT INTO favorite_jobs (id, user_id, job_id, created_at)
            VALUES (?, ?, ?, ?)
            "#,
            &[
                &favorite_id.to_string(),
                &user_id.to_string(),
                &job_id.to_string(),
                &now,
            ],
        ).unwrap();

        // Test suppression d'un favori
        let result = remove_favorite_job(&db, user_id, job_id).await;
        assert!(result.is_ok());

        // Vérifier que le favori a été supprimé
        let mut rows = conn.query(
            "SELECT * FROM favorite_jobs WHERE user_id = ? AND job_id = ?",
            &[&user_id.to_string(), &job_id.to_string()],
        ).unwrap();
        assert!(rows.next().unwrap().is_none());

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_get_favorite_jobs() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer des jobs et des favoris
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        for i in 0..3 {
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

            let favorite_id = Uuid::new_v4();
            conn.execute(
                r#"
                INSERT INTO favorite_jobs (id, user_id, job_id, created_at)
                VALUES (?, ?, ?, ?)
                "#,
                &[
                    &favorite_id.to_string(),
                    &user_id.to_string(),
                    &job_id.to_string(),
                    &now,
                ],
            ).unwrap();
        }

        // Test récupération des favoris
        let result = get_favorite_jobs(&db, user_id).await;
        assert!(result.is_ok());
        let jobs = result.unwrap();
        assert_eq!(jobs.len(), 3);

        cleanup_test_db(&db).await;
    }

    #[tokio::test]
    async fn test_is_job_favorite() {
        let db = setup_test_db().await;
        let conn = db.get("sqlite:test.db").unwrap();

        // Créer un job et un favori
        let job_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        conn.execute(
            r#"
            INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, 
                            job_type, experience_level, created_at, updated_at, status, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &job_id.to_string(),
                &"Test Job",
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

        let favorite_id = Uuid::new_v4();
        conn.execute(
            r#"
            INSERT INTO favorite_jobs (id, user_id, job_id, created_at)
            VALUES (?, ?, ?, ?)
            "#,
            &[
                &favorite_id.to_string(),
                &user_id.to_string(),
                &job_id.to_string(),
                &now,
            ],
        ).unwrap();

        // Test vérification d'un favori existant
        let result = is_job_favorite(&db, user_id, job_id).await;
        assert!(result.is_ok());
        assert!(result.unwrap());

        // Test vérification d'un favori inexistant
        let result = is_job_favorite(&db, user_id, Uuid::new_v4()).await;
        assert!(result.is_ok());
        assert!(!result.unwrap());

        cleanup_test_db(&db).await;
    }
} 