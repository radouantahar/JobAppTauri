use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::commands::{auth, documents, applications};

#[tokio::test]
async fn test_auth_commands() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Tester l'inscription
    let email = "test@example.com";
    let password = "password123";
    let first_name = "Test";
    let last_name = "User";
    
    auth::register(
        email.to_string(),
        password.to_string(),
        first_name.to_string(),
        last_name.to_string(),
        &pool,
    ).await.unwrap();

    // Tester la connexion
    let user = auth::login(
        email.to_string(),
        password.to_string(),
        &pool,
    ).await.unwrap();
    
    assert_eq!(user.email, email);
    assert_eq!(user.first_name, first_name);
}

#[tokio::test]
async fn test_document_commands() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Tester la création de document
    let name = "Test Document";
    let content = "Test Content";
    let document_type = "CV";
    
    documents::create_document(
        name.to_string(),
        content.to_string(),
        document_type.to_string(),
        &pool,
    ).await.unwrap();

    // Tester la récupération des documents
    let all_documents = documents::get_documents(&pool).await.unwrap();
    assert!(!all_documents.is_empty());
    assert_eq!(all_documents[0].name, name);
}

#[tokio::test]
async fn test_application_commands() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer un utilisateur pour le test
    let user = auth::register(
        "test@example.com".to_string(),
        "password123".to_string(),
        "Test".to_string(),
        "User".to_string(),
        &pool,
    ).await.unwrap();

    // Tester la création d'une candidature
    let job_id = Uuid::new_v4();
    let status = "Applied";
    let notes = Some("Test notes".to_string());
    
    applications::create_application(
        user.id,
        job_id,
        status.to_string(),
        notes,
        &pool,
    ).await.unwrap();

    // Tester la récupération des candidatures
    let user_applications = applications::get_user_applications(user.id, &pool).await.unwrap();
    assert!(!user_applications.is_empty());
    assert_eq!(user_applications[0].status, status);
} 