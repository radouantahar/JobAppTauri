use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use chrono::Utc;
use crate::db::job_repository::JobRepository;
use crate::models::{Job, JobStats};

async fn setup_test_db() -> Result<TauriSql, String> {
    let db = TauriSql::new("sqlite:test.db")?;
    let conn = db.get("sqlite:test.db")?;

    // Créer les tables nécessaires
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            salary_min REAL,
            salary_max REAL,
            job_type TEXT NOT NULL,
            experience_level TEXT NOT NULL,
            status TEXT NOT NULL,
            url TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
        "#,
        &[],
    )?;

    Ok(db)
}

#[tokio::test]
async fn test_create_job() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let job = Job {
        id: Uuid::new_v4(),
        title: "Software Engineer".to_string(),
        company: "Test Company".to_string(),
        location: "Test Location".to_string(),
        description: "Test Description".to_string(),
        salary_min: Some(50000.0),
        salary_max: Some(100000.0),
        job_type: "Full-time".to_string(),
        experience_level: "Mid-level".to_string(),
        status: "active".to_string(),
        url: Some("https://example.com".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    conn.execute(
        r#"
        INSERT INTO jobs (
            id, title, company, location, description,
            salary_min, salary_max, job_type, experience_level,
            status, url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &job.id.to_string(),
            &job.title,
            &job.company,
            &job.location,
            &job.description,
            &job.salary_min.map(|s| s.to_string()).unwrap_or_default(),
            &job.salary_max.map(|s| s.to_string()).unwrap_or_default(),
            &job.job_type,
            &job.experience_level,
            &job.status,
            &job.url.as_deref().unwrap_or(""),
            &job.created_at,
            &job.updated_at,
        ],
    )?;

    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE id = ?",
        &[&job.id.to_string()],
    )?;

    let created_job = if let Some(row) = rows.next()? {
        Job {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            description: row.get("description")?,
            salary_min: row.get::<String>("salary_min")?.parse().ok(),
            salary_max: row.get::<String>("salary_max")?.parse().ok(),
            job_type: row.get("job_type")?,
            experience_level: row.get("experience_level")?,
            status: row.get("status")?,
            url: Some(row.get("url")?),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        }
    } else {
        return Err("Job not found".to_string());
    };

    assert_eq!(created_job.id, job.id);
    assert_eq!(created_job.title, job.title);
    assert_eq!(created_job.company, job.company);

    Ok(())
}

#[tokio::test]
async fn test_update_job() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let job_id = Uuid::new_v4();
    let now = Utc::now();

    // Créer un job
    conn.execute(
        r#"
        INSERT INTO jobs (
            id, title, company, location, description,
            salary_min, salary_max, job_type, experience_level,
            status, url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &job_id.to_string(),
            "Old Title",
            "Old Company",
            "Old Location",
            "Old Description",
            "50000",
            "100000",
            "Full-time",
            "Mid-level",
            "active",
            "https://example.com",
            &now,
            &now,
        ],
    )?;

    // Mettre à jour le job
    let new_title = "New Title";
    let new_company = "New Company";
    let new_now = Utc::now();

    conn.execute(
        r#"
        UPDATE jobs 
        SET title = ?, company = ?, updated_at = ?
        WHERE id = ?
        "#,
        &[new_title, new_company, &new_now, &job_id.to_string()],
    )?;

    // Vérifier la mise à jour
    let mut rows = conn.query(
        "SELECT * FROM jobs WHERE id = ?",
        &[&job_id.to_string()],
    )?;

    let updated_job = if let Some(row) = rows.next()? {
        Job {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            title: row.get("title")?,
            company: row.get("company")?,
            location: row.get("location")?,
            description: row.get("description")?,
            salary_min: row.get::<String>("salary_min")?.parse().ok(),
            salary_max: row.get::<String>("salary_max")?.parse().ok(),
            job_type: row.get("job_type")?,
            experience_level: row.get("experience_level")?,
            status: row.get("status")?,
            url: Some(row.get("url")?),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        }
    } else {
        return Err("Job not found".to_string());
    };

    assert_eq!(updated_job.title, new_title);
    assert_eq!(updated_job.company, new_company);

    Ok(())
}

#[tokio::test]
async fn test_delete_job() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let job_id = Uuid::new_v4();
    let now = Utc::now();

    // Créer un job
    conn.execute(
        r#"
        INSERT INTO jobs (
            id, title, company, location, description,
            salary_min, salary_max, job_type, experience_level,
            status, url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &job_id.to_string(),
            "Test Title",
            "Test Company",
            "Test Location",
            "Test Description",
            "50000",
            "100000",
            "Full-time",
            "Mid-level",
            "active",
            "https://example.com",
            &now,
            &now,
        ],
    )?;

    // Supprimer le job
    conn.execute(
        "DELETE FROM jobs WHERE id = ?",
        &[&job_id.to_string()],
    )?;

    // Vérifier la suppression
    let mut rows = conn.query(
        "SELECT COUNT(*) as count FROM jobs WHERE id = ?",
        &[&job_id.to_string()],
    )?;

    if let Some(row) = rows.next()? {
        let count: i64 = row.get("count")?;
        assert_eq!(count, 0);
    }

    Ok(())
}

#[tokio::test]
async fn test_list_jobs() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let now = Utc::now();

    // Créer plusieurs jobs
    for i in 0..3 {
        let job_id = Uuid::new_v4();
        conn.execute(
            r#"
            INSERT INTO jobs (
                id, title, company, location, description,
                salary_min, salary_max, job_type, experience_level,
                status, url, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            &[
                &job_id.to_string(),
                &format!("Title {}", i),
                &format!("Company {}", i),
                &format!("Location {}", i),
                &format!("Description {}", i),
                "50000",
                "100000",
                "Full-time",
                "Mid-level",
                "active",
                "https://example.com",
                &now,
                &now,
            ],
        )?;
    }

    // Lister les jobs
    let mut rows = conn.query("SELECT COUNT(*) as count FROM jobs", &[])?;

    if let Some(row) = rows.next()? {
        let count: i64 = row.get("count")?;
        assert_eq!(count, 3);
    }

    Ok(())
}

#[sqlx::test]
async fn test_get_user_jobs(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let user_profile_id = Uuid::new_v4();
    let job1 = Job {
        id: Uuid::new_v4(),
        user_profile_id,
        title: "Software Engineer".to_string(),
        company: "Tech Corp".to_string(),
        location: "Paris".to_string(),
        description: "Looking for a skilled software engineer".to_string(),
        status: "active".to_string(),
        url: "https://example.com/job1".to_string(),
        salary_min: Some(50000),
        salary_max: Some(70000),
        currency: Some("EUR".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let job2 = Job {
        id: Uuid::new_v4(),
        user_profile_id,
        title: "Data Scientist".to_string(),
        company: "Data Corp".to_string(),
        location: "Lyon".to_string(),
        description: "Looking for a data scientist".to_string(),
        status: "active".to_string(),
        url: "https://example.com/job2".to_string(),
        salary_min: Some(60000),
        salary_max: Some(80000),
        currency: Some("EUR".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let _ = repo.create_job(&job1).await.unwrap();
    let _ = repo.create_job(&job2).await.unwrap();

    let user_jobs = repo.get_user_jobs(user_profile_id).await.unwrap();
    assert_eq!(user_jobs.len(), 2);
}

#[sqlx::test]
async fn test_create_and_get_job_stats(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let user_profile_id = Uuid::new_v4();
    let job = Job {
        id: Uuid::new_v4(),
        user_profile_id,
        title: "Software Engineer".to_string(),
        company: "Tech Corp".to_string(),
        location: "Paris".to_string(),
        description: "Looking for a skilled software engineer".to_string(),
        status: "active".to_string(),
        url: "https://example.com/job".to_string(),
        salary_min: Some(50000),
        salary_max: Some(70000),
        currency: Some("EUR".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let _ = repo.create_job(&job).await.unwrap();

    let stats = JobStats {
        id: Uuid::new_v4(),
        job_id: job.id,
        matching_score: 85.5,
        commute_time: 30,
        skills_match: 90.0,
        experience_match: 80.0,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Test create stats
    let created_stats = repo.create_job_stats(&stats).await.unwrap();
    assert_eq!(created_stats.matching_score, stats.matching_score);
    assert_eq!(created_stats.commute_time, stats.commute_time);

    // Test get stats
    let retrieved_stats = repo.get_job_stats(job.id).await.unwrap().unwrap();
    assert_eq!(retrieved_stats.matching_score, stats.matching_score);
    assert_eq!(retrieved_stats.commute_time, stats.commute_time);
}

#[sqlx::test]
async fn test_get_nonexistent_job(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let nonexistent_id = Uuid::new_v4();
    
    let result = repo.get_job(nonexistent_id).await.unwrap();
    assert!(result.is_none());
}

#[sqlx::test]
async fn test_get_nonexistent_job_stats(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let nonexistent_job_id = Uuid::new_v4();
    
    let result = repo.get_job_stats(nonexistent_job_id).await.unwrap();
    assert!(result.is_none());
}

#[sqlx::test]
async fn test_get_jobs_for_nonexistent_user(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let nonexistent_user_id = Uuid::new_v4();
    
    let result = repo.get_user_jobs(nonexistent_user_id).await.unwrap();
    assert!(result.is_empty());
}

#[sqlx::test]
async fn test_create_job_with_minimal_data(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let user_profile_id = Uuid::new_v4();
    let job = Job {
        id: Uuid::new_v4(),
        user_profile_id,
        title: "Minimal Job".to_string(),
        company: "Minimal Company".to_string(),
        location: None,
        description: None,
        status: "active".to_string(),
        url: None,
        salary_min: None,
        salary_max: None,
        currency: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let created_job = repo.create_job(&job).await.unwrap();
    assert_eq!(created_job.title, job.title);
    assert_eq!(created_job.company, job.company);
    assert!(created_job.location.is_none());
    assert!(created_job.description.is_none());
}

#[sqlx::test]
async fn test_create_job_stats_with_minimal_data(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let user_profile_id = Uuid::new_v4();
    let job = Job {
        id: Uuid::new_v4(),
        user_profile_id,
        title: "Test Job".to_string(),
        company: "Test Company".to_string(),
        location: None,
        description: None,
        status: "active".to_string(),
        url: None,
        salary_min: None,
        salary_max: None,
        currency: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let _ = repo.create_job(&job).await.unwrap();

    let stats = JobStats {
        id: Uuid::new_v4(),
        job_id: job.id,
        matching_score: 85.5,
        commute_time: None,
        skills_match: None,
        experience_match: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let created_stats = repo.create_job_stats(&stats).await.unwrap();
    assert_eq!(created_stats.matching_score, stats.matching_score);
    assert!(created_stats.commute_time.is_none());
    assert!(created_stats.skills_match.is_none());
    assert!(created_stats.experience_match.is_none());
}

#[sqlx::test]
async fn test_delete_nonexistent_job(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let nonexistent_id = Uuid::new_v4();
    
    // Should not throw an error when deleting a nonexistent job
    repo.delete_job(nonexistent_id).await.unwrap();
} 