use super::*;
use crate::models::application::Application;
use crate::models::traits::DatabaseModel;
use crate::types::DbPool;
use chrono::Utc;
use uuid::Uuid;
use tauri_plugin_sql::TauriSql;

// Helper pour créer une connexion de test
async fn setup_test_db() -> DbPool {
    let db = TauriSql::load("sqlite::memory:").await.unwrap();
    
    // Création des tables nécessaires
    db.execute(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            position TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            cv_path TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
        "#,
        &[],
    )
    .await
    .unwrap();

    db
}

// Helper pour créer des données de test
fn create_test_application() -> Application {
    Application {
        id: Uuid::new_v4().to_string(),
        user_id: Uuid::new_v4().to_string(),
        job_id: Uuid::new_v4().to_string(),
        status: "En cours".to_string(),
        notes: Some("Test notes".to_string()),
        cv_path: Some("/path/to/cv.pdf".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

#[tokio::test]
async fn test_create_application() {
    let db = setup_test_db().await;
    let app = create_test_application();
    
    // Test création
    assert!(Application::create(&db, &app).await.is_ok());
    
    // Vérification de l'existence
    let found = Application::find_by_id(&db, &app.id).await.unwrap();
    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.id, app.id);
    assert_eq!(found.status, app.status);
    assert_eq!(found.notes, app.notes);
}

#[tokio::test]
async fn test_update_application() {
    let db = setup_test_db().await;
    let mut app = create_test_application();
    
    // Création initiale
    Application::create(&db, &app).await.unwrap();
    
    // Modification
    app.status = "Acceptée".to_string();
    app.notes = Some("Updated notes".to_string());
    app.updated_at = Utc::now();
    
    assert!(Application::update(&db, &app).await.is_ok());
    
    // Vérification des modifications
    let updated = Application::find_by_id(&db, &app.id).await.unwrap().unwrap();
    assert_eq!(updated.status, "Acceptée");
    assert_eq!(updated.notes, Some("Updated notes".to_string()));
}

#[tokio::test]
async fn test_delete_application() {
    let db = setup_test_db().await;
    let app = create_test_application();
    
    // Création puis suppression
    Application::create(&db, &app).await.unwrap();
    assert!(Application::delete(&db, &app.id).await.is_ok());
    
    // Vérification de la suppression
    let found = Application::find_by_id(&db, &app.id).await.unwrap();
    assert!(found.is_none());
}

#[tokio::test]
async fn test_find_by_user_id() {
    let db = setup_test_db().await;
    let user_id = Uuid::new_v4().to_string();
    
    // Création de plusieurs candidatures
    for _ in 0..3 {
        let mut app = create_test_application();
        app.user_id = user_id.clone();
        Application::create(&db, &app).await.unwrap();
    }
    
    // Création d'une candidature pour un autre utilisateur
    let other_app = create_test_application();
    Application::create(&db, &other_app).await.unwrap();
    
    // Vérification
    let user_apps = Application::find_by_user_id(&db, &user_id).await.unwrap();
    assert_eq!(user_apps.len(), 3);
    for app in user_apps {
        assert_eq!(app.user_id, user_id);
    }
}

#[tokio::test]
async fn test_search_applications() {
    let db = setup_test_db().await;
    let user_id = Uuid::new_v4().to_string();
    let job_id = Uuid::new_v4().to_string();
    
    // Création des données de test
    db.execute(
        "INSERT INTO jobs (id, company_name, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        &[&job_id, "Test Company", "Developer", &Utc::now(), &Utc::now()],
    )
    .await
    .unwrap();
    
    let mut app = create_test_application();
    app.user_id = user_id.clone();
    app.job_id = job_id;
    app.notes = Some("Recherche développeur React".to_string());
    Application::create(&db, &app).await.unwrap();
    
    // Test de recherche
    let results = Application::search(&db, &user_id, "React").await.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].notes, Some("Recherche développeur React".to_string()));
    
    // Test de recherche sans résultat
    let results = Application::search(&db, &user_id, "Python").await.unwrap();
    assert_eq!(results.len(), 0);
} 