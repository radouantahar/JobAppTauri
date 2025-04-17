use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use std::time::Instant;
use crate::models::{User, Document, Application};

#[tokio::test]
async fn test_query_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test de performance pour la création d'utilisateurs
    let start = Instant::now();
    for i in 0..100 {
        let user = User {
            id: Uuid::new_v4(),
            email: format!("test{}@example.com", i),
            password_hash: "hashed_password".to_string(),
            first_name: format!("Test{}", i),
            last_name: "User".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        user.create(&pool).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour créer 100 utilisateurs: {:?}", duration);
    assert!(duration.as_secs() < 5);

    // Test de performance pour la recherche d'utilisateurs
    let start = Instant::now();
    for i in 0..100 {
        let _ = User::find_by_email(&pool, &format!("test{}@example.com", i)).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour rechercher 100 utilisateurs: {:?}", duration);
    assert!(duration.as_secs() < 5);

    // Test de performance pour les documents
    let start = Instant::now();
    for i in 0..100 {
        let document = Document {
            id: Uuid::new_v4(),
            name: format!("Document {}", i),
            content: "Test Content".to_string(),
            document_type: "CV".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        document.create(&pool).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour créer 100 documents: {:?}", duration);
    assert!(duration.as_secs() < 5);

    // Test de performance pour les candidatures
    let start = Instant::now();
    for i in 0..100 {
        let application = Application {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            job_id: Uuid::new_v4(),
            status: "Applied".to_string(),
            applied_date: Utc::now(),
            notes: Some(format!("Note {}", i)),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        application.create(&pool).await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour créer 100 candidatures: {:?}", duration);
    assert!(duration.as_secs() < 5);
}

#[tokio::test]
async fn test_concurrent_operations() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test d'opérations concurrentes
    let mut handles = vec![];
    
    for i in 0..10 {
        let pool = pool.clone();
        let handle = tokio::spawn(async move {
            let user = User {
                id: Uuid::new_v4(),
                email: format!("concurrent{}@example.com", i),
                password_hash: "hashed_password".to_string(),
                first_name: format!("Concurrent{}", i),
                last_name: "User".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            user.create(&pool).await.unwrap();
            
            let document = Document {
                id: Uuid::new_v4(),
                name: format!("Concurrent Document {}", i),
                content: "Test Content".to_string(),
                document_type: "CV".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            document.create(&pool).await.unwrap();
        });
        handles.push(handle);
    }
    
    let start = Instant::now();
    for handle in handles {
        handle.await.unwrap();
    }
    let duration = start.elapsed();
    println!("Temps pour opérations concurrentes: {:?}", duration);
    assert!(duration.as_secs() < 5);
}

#[tokio::test]
async fn test_bulk_operations() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test de performance pour les opérations en masse
    let start = Instant::now();
    
    // Créer 1000 utilisateurs en une seule transaction
    let result = pool.transaction(|tx| async move {
        for i in 0..1000 {
            let user = User {
                id: Uuid::new_v4(),
                email: format!("bulk{}@example.com", i),
                password_hash: "hashed_password".to_string(),
                first_name: format!("Bulk{}", i),
                last_name: "User".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            user.create(&tx).await?;
        }
        Ok(())
    }).await;
    
    assert!(result.is_ok());
    let duration = start.elapsed();
    println!("Temps pour créer 1000 utilisateurs en une transaction: {:?}", duration);
    assert!(duration.as_secs() < 10);
}

#[tokio::test]
async fn test_query_optimization() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Créer des données de test
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

    // Créer 100 documents
    for i in 0..100 {
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

    // Test: Performance de la recherche avec index
    let start = Instant::now();
    let cvs = Document::find_by_type(&pool, "CV").await.unwrap();
    let duration = start.elapsed();
    println!("Temps pour rechercher les CVs: {:?}", duration);
    assert!(duration.as_millis() < 100); // Doit être très rapide avec l'index
    assert_eq!(cvs.len(), 50); // 50 CVs créés
} 