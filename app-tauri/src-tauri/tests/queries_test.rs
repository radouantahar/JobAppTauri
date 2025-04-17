use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{User, Document, Application};

#[tokio::test]
async fn test_complex_queries() {
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
    user.create(&pool).await.unwrap();

    // Créer plusieurs documents pour l'utilisateur
    for i in 0..5 {
        let document = Document {
            id: Uuid::new_v4(),
            name: format!("Document {}", i),
            content: format!("Content {}", i),
            document_type: if i % 2 == 0 { "CV" } else { "Lettre" }.to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        document.create(&pool).await.unwrap();
    }

    // Créer plusieurs candidatures
    for i in 0..10 {
        let application = Application {
            id: Uuid::new_v4(),
            user_id: user.id,
            job_id: Uuid::new_v4(),
            status: match i % 3 {
                0 => "Applied",
                1 => "Interview",
                _ => "Rejected",
            }.to_string(),
            applied_date: Utc::now(),
            notes: Some(format!("Note {}", i)),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        application.create(&pool).await.unwrap();
    }

    // Test: Récupérer les documents par type
    let cvs = Document::find_by_type(&pool, "CV").await.unwrap();
    assert_eq!(cvs.len(), 3); // 3 CVs créés

    // Test: Récupérer les candidatures par statut
    let applied = Application::find_by_status(&pool, "Applied").await.unwrap();
    assert_eq!(applied.len(), 4); // 4 candidatures avec statut "Applied"

    // Test: Récupérer les candidatures d'un utilisateur avec un statut spécifique
    let user_applications = Application::find_by_user_and_status(&pool, user.id, "Interview").await.unwrap();
    assert_eq!(user_applications.len(), 3); // 3 candidatures en entretien
}

#[tokio::test]
async fn test_query_optimization() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer 1000 utilisateurs
    for i in 0..1000 {
        let user = User {
            id: Uuid::new_v4(),
            email: format!("user{}@example.com", i),
            password_hash: "hashed_password".to_string(),
            first_name: format!("User{}", i),
            last_name: "Test".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        user.create(&pool).await.unwrap();
    }

    // Test: Performance de la recherche avec index
    let start = Instant::now();
    for i in 0..100 {
        let _ = User::find_by_email(&pool, &format!("user{}@example.com", i)).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour 100 recherches par email: {:?}", duration);
    assert!(duration.as_secs() < 1); // Doit être rapide avec l'index

    // Test: Performance de la recherche sans index
    let start = Instant::now();
    for i in 0..100 {
        let _ = User::find_by_first_name(&pool, &format!("User{}", i)).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour 100 recherches par prénom: {:?}", duration);
    assert!(duration.as_secs() < 2); // Peut être un peu plus lent sans index
}

#[tokio::test]
async fn test_transaction_rollback() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test: Rollback en cas d'erreur
    let result = pool.transaction(|tx| async move {
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
        user.create(&tx).await?;

        // Simuler une erreur
        Err(anyhow::anyhow!("Erreur de test"))?;

        Ok(())
    }).await;

    assert!(result.is_err());
    
    // Vérifier que l'utilisateur n'a pas été créé
    let user = User::find_by_email(&pool, "test@example.com").await.unwrap();
    assert!(user.is_none());
} 