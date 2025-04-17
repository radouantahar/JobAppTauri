use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{User, Document, Application};

#[tokio::test]
async fn test_user_operations() {
    // Créer une connexion à la base de données en mémoire
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer un utilisateur
    let user = User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Tester la création
    user.create(&pool).await.unwrap();

    // Tester la recherche par email
    let found_user = User::find_by_email(&pool, "test@example.com").await.unwrap();
    assert!(found_user.is_some());
    assert_eq!(found_user.unwrap().email, "test@example.com");
}

#[tokio::test]
async fn test_document_operations() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer un document
    let document = Document {
        id: Uuid::new_v4(),
        name: "Test Document".to_string(),
        content: "Test Content".to_string(),
        document_type: "CV".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Tester la création
    document.create(&pool).await.unwrap();

    // Tester la recherche par ID
    let found_document = Document::find_by_id(&pool, document.id).await.unwrap();
    assert!(found_document.is_some());
    assert_eq!(found_document.unwrap().name, "Test Document");
}

#[tokio::test]
async fn test_application_operations() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer un utilisateur pour le test
    let user = User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    user.create(&pool).await.unwrap();

    // Créer une application
    let application = Application {
        id: Uuid::new_v4(),
        user_id: user.id,
        job_id: Uuid::new_v4(),
        status: "Applied".to_string(),
        applied_date: Utc::now(),
        notes: Some("Test notes".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Tester la création
    application.create(&pool).await.unwrap();

    // Tester la recherche par user_id
    let found_applications = Application::find_by_user_id(&pool, user.id).await.unwrap();
    assert!(!found_applications.is_empty());
    assert_eq!(found_applications[0].status, "Applied");
} 