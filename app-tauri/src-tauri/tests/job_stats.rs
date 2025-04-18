use crate::models::job_stats::JobStats;
use crate::types::{DbPool, DbResult};
use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::time::Instant;

// Fonction utilitaire pour initialiser la base de données de test
async fn setup_test_db() -> DbPool {
    let pool = SqlitePool::new(":memory:").await.unwrap();
    
    // Créer la table job_stats
    pool.execute(
        r#"
        CREATE TABLE job_stats (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            commute_time INTEGER,
            skills_match REAL,
            experience_match REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        &[],
    ).await.unwrap();

    pool
}

// Fonction utilitaire pour nettoyer la base de données de test
async fn cleanup_test_db(pool: &DbPool) {
    pool.execute("DROP TABLE IF EXISTS job_stats", &[]).await.unwrap();
}

#[tokio::test]
async fn test_create_job_stats() {
    let pool = setup_test_db().await;
    
    let job_stats = JobStats {
        id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        job_id: Uuid::new_v4(),
        commute_time: Some(30),
        skills_match: Some(0.85),
        experience_match: Some(0.90),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Test de création
    let result = JobStats::create(&pool, &job_stats).await;
    assert!(result.is_ok());

    // Vérification de la création
    let retrieved = JobStats::find_by_id(&pool, &job_stats.id.to_string()).await.unwrap();
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, job_stats.id);
    assert_eq!(retrieved.user_id, job_stats.user_id);
    assert_eq!(retrieved.job_id, job_stats.job_id);
    assert_eq!(retrieved.commute_time, job_stats.commute_time);
    assert_eq!(retrieved.skills_match, job_stats.skills_match);
    assert_eq!(retrieved.experience_match, job_stats.experience_match);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
async fn test_update_job_stats() {
    let pool = setup_test_db().await;
    
    let mut job_stats = JobStats {
        id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        job_id: Uuid::new_v4(),
        commute_time: Some(30),
        skills_match: Some(0.85),
        experience_match: Some(0.90),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Création initiale
    JobStats::create(&pool, &job_stats).await.unwrap();

    // Mise à jour
    job_stats.commute_time = Some(45);
    job_stats.skills_match = Some(0.95);
    job_stats.updated_at = Utc::now();
    
    let result = JobStats::update(&pool, &job_stats).await;
    assert!(result.is_ok());

    // Vérification de la mise à jour
    let retrieved = JobStats::find_by_id(&pool, &job_stats.id.to_string()).await.unwrap().unwrap();
    assert_eq!(retrieved.commute_time, Some(45));
    assert_eq!(retrieved.skills_match, Some(0.95));

    cleanup_test_db(&pool).await;
}

#[tokio::test]
async fn test_delete_job_stats() {
    let pool = setup_test_db().await;
    
    let job_stats = JobStats {
        id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        job_id: Uuid::new_v4(),
        commute_time: Some(30),
        skills_match: Some(0.85),
        experience_match: Some(0.90),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Création
    JobStats::create(&pool, &job_stats).await.unwrap();

    // Suppression
    let result = JobStats::delete(&pool, &job_stats.id.to_string()).await;
    assert!(result.is_ok());

    // Vérification de la suppression
    let retrieved = JobStats::find_by_id(&pool, &job_stats.id.to_string()).await.unwrap();
    assert!(retrieved.is_none());

    cleanup_test_db(&pool).await;
}

#[tokio::test]
async fn test_performance() {
    let pool = setup_test_db().await;
    
    // Création de 1000 entrées pour le test de performance
    let start_time = Instant::now();
    
    for i in 0..1000 {
        let job_stats = JobStats {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            job_id: Uuid::new_v4(),
            commute_time: Some(i as i32),
            skills_match: Some(0.85),
            experience_match: Some(0.90),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        JobStats::create(&pool, &job_stats).await.unwrap();
    }
    
    let creation_time = start_time.elapsed();
    println!("Temps de création de 1000 entrées: {:?}", creation_time);
    assert!(creation_time.as_secs() < 5); // Le test doit s'exécuter en moins de 5 secondes

    cleanup_test_db(&pool).await;
}

#[tokio::test]
async fn test_error_handling() {
    let pool = setup_test_db().await;
    
    // Test avec un ID invalide
    let result = JobStats::find_by_id(&pool, "invalid-uuid").await;
    assert!(result.is_err());

    // Test avec un ID inexistant
    let result = JobStats::find_by_id(&pool, &Uuid::new_v4().to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());

    // Test de suppression d'un élément inexistant
    let result = JobStats::delete(&pool, &Uuid::new_v4().to_string()).await;
    assert!(result.is_ok()); // La suppression d'un élément inexistant ne devrait pas générer d'erreur

    cleanup_test_db(&pool).await;
} 