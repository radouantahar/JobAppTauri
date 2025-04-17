use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::db::job_repository::JobRepository;
use crate::models::{Job, JobStats};

#[sqlx::test]
async fn test_create_and_get_job(pool: SqlitePool) {
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

    // Test create
    let created_job = repo.create_job(&job).await.unwrap();
    assert_eq!(created_job.title, job.title);
    assert_eq!(created_job.company, job.company);

    // Test get
    let retrieved_job = repo.get_job(job.id).await.unwrap().unwrap();
    assert_eq!(retrieved_job.title, job.title);
    assert_eq!(retrieved_job.company, job.company);
}

#[sqlx::test]
async fn test_update_job(pool: SqlitePool) {
    let repo = JobRepository::new(pool);
    let user_profile_id = Uuid::new_v4();
    let mut job = Job {
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

    // Update job
    job.title = "Senior Software Engineer".to_string();
    job.salary_min = Some(70000);
    job.salary_max = Some(90000);

    let updated_job = repo.update_job(&job).await.unwrap();
    assert_eq!(updated_job.title, "Senior Software Engineer");
    assert_eq!(updated_job.salary_min, Some(70000));
    assert_eq!(updated_job.salary_max, Some(90000));
}

#[sqlx::test]
async fn test_delete_job(pool: SqlitePool) {
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

    // Delete job
    repo.delete_job(job.id).await.unwrap();

    // Verify job is deleted
    let deleted_job = repo.get_job(job.id).await.unwrap();
    assert!(deleted_job.is_none());
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