use crate::db::user_repository::UserRepository;
use crate::models::{User, UserProfile, Document};
use tauri_plugin_sql::SqlitePool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::Result;

async fn setup_test_db() -> Result<SqlitePool> {
    let pool = SqlitePool::new(":memory:").await?;
    
    // Création des tables
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            primary_home TEXT NOT NULL,
            secondary_home TEXT,
            skills TEXT,
            experience TEXT,
            education TEXT,
            cv_path TEXT,
            cv_last_updated TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            document_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            file_path TEXT,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        "#,
        &[]
    ).await?;

    Ok(pool)
}

#[tokio::test]
async fn test_user_crud() -> Result<()> {
    let pool = setup_test_db().await?;
    let repo = UserRepository::new(pool);

    // Test création utilisateur
    let user = repo.create_user("test@example.com", "hashed_password").await?;
    assert_eq!(user.email, "test@example.com");
    assert_eq!(user.password_hash, "hashed_password");

    // Test récupération par ID
    let retrieved_user = repo.get_user_by_id(&user.id).await?;
    assert!(retrieved_user.is_some());
    assert_eq!(retrieved_user.unwrap().email, "test@example.com");

    // Test récupération par email
    let user_by_email = repo.get_user_by_email("test@example.com").await?;
    assert!(user_by_email.is_some());
    assert_eq!(user_by_email.unwrap().id, user.id);

    // Test mise à jour du mot de passe
    repo.update_user_password(&user.id, "new_hashed_password").await?;
    let updated_user = repo.get_user_by_id(&user.id).await?.unwrap();
    assert_eq!(updated_user.password_hash, "new_hashed_password");

    // Test suppression
    repo.delete_user(&user.id).await?;
    let deleted_user = repo.get_user_by_id(&user.id).await?;
    assert!(deleted_user.is_none());

    Ok(())
}

#[tokio::test]
async fn test_user_profile_crud() -> Result<()> {
    let pool = setup_test_db().await?;
    let repo = UserRepository::new(pool);

    // Création d'un utilisateur pour le test
    let user = repo.create_user("profile_test@example.com", "password").await?;

    // Test création profil
    let profile = repo.create_user_profile(&user.id, "Test User", "Paris").await?;
    assert_eq!(profile.name, "Test User");
    assert_eq!(profile.primary_home, "Paris");

    // Test récupération profil
    let retrieved_profile = repo.get_user_profile(&user.id).await?;
    assert!(retrieved_profile.is_some());
    let profile = retrieved_profile.unwrap();
    assert_eq!(profile.name, "Test User");

    // Test mise à jour profil
    let mut updated_profile = profile;
    updated_profile.phone = Some("0123456789".to_string());
    updated_profile.location = Some("France".to_string());
    repo.update_user_profile(&updated_profile).await?;

    let final_profile = repo.get_user_profile(&user.id).await?.unwrap();
    assert_eq!(final_profile.phone, Some("0123456789".to_string()));
    assert_eq!(final_profile.location, Some("France".to_string()));

    Ok(())
}

#[tokio::test]
async fn test_document_crud() -> Result<()> {
    let pool = setup_test_db().await?;
    let repo = UserRepository::new(pool);

    // Création d'un utilisateur pour le test
    let user = repo.create_user("doc_test@example.com", "password").await?;

    // Test création document
    let document = repo.create_document(
        &user.id,
        "CV.pdf",
        "CV",
        1024,
        Some("/path/to/cv.pdf".to_string()),
        Some("Mon CV".to_string()),
    ).await?;

    assert_eq!(document.name, "CV.pdf");
    assert_eq!(document.document_type, "CV");
    assert_eq!(document.size, 1024);

    // Test récupération documents
    let documents = repo.get_user_documents(&user.id).await?;
    assert_eq!(documents.len(), 1);
    assert_eq!(documents[0].name, "CV.pdf");

    // Test suppression document
    repo.delete_document(&document.id).await?;
    let remaining_documents = repo.get_user_documents(&user.id).await?;
    assert_eq!(remaining_documents.len(), 0);

    Ok(())
}

#[tokio::test]
async fn test_cascade_deletion() -> Result<()> {
    let pool = setup_test_db().await?;
    let repo = UserRepository::new(pool);

    // Création d'un utilisateur avec profil et documents
    let user = repo.create_user("cascade_test@example.com", "password").await?;
    let _profile = repo.create_user_profile(&user.id, "Test User", "Paris").await?;
    let _document = repo.create_document(
        &user.id,
        "test.pdf",
        "test",
        512,
        None,
        None,
    ).await?;

    // Suppression de l'utilisateur
    repo.delete_user(&user.id).await?;

    // Vérification que le profil et les documents ont été supprimés
    let profile = repo.get_user_profile(&user.id).await?;
    assert!(profile.is_none());

    let documents = repo.get_user_documents(&user.id).await?;
    assert_eq!(documents.len(), 0);

    Ok(())
}

#[tokio::test]
async fn test_error_cases() -> Result<()> {
    let pool = setup_test_db().await?;
    let repo = UserRepository::new(pool);

    // Test récupération d'un utilisateur inexistant
    let nonexistent_id = Uuid::new_v4().to_string();
    let result = repo.get_user_by_id(&nonexistent_id).await?;
    assert!(result.is_none());

    // Test récupération par email inexistant
    let result = repo.get_user_by_email("nonexistent@example.com").await?;
    assert!(result.is_none());

    // Test suppression d'un utilisateur inexistant
    repo.delete_user(&nonexistent_id).await?; // Ne devrait pas générer d'erreur

    // Test création d'un utilisateur avec un email déjà existant
    let user = repo.create_user("duplicate@example.com", "password").await?;
    let result = repo.create_user("duplicate@example.com", "password").await;
    assert!(result.is_err());

    Ok(())
} 