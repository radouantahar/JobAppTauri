use tauri_plugin_sql::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use std::time::Instant;
use crate::models::{User, Document, Application};

#[tokio::test]
async fn test_insert_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test: Performance d'insertion simple
    let start = Instant::now();
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
    let duration = start.elapsed();
    println!("Temps pour une insertion simple: {:?}", duration);
    assert!(duration.as_millis() < 100);

    // Test: Performance d'insertion en masse (1000 enregistrements)
    let start = Instant::now();
    for i in 0..1000 {
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
    println!("Temps pour 1000 insertions: {:?}", duration);
    assert!(duration.as_secs() < 5);
}

#[tokio::test]
async fn test_query_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Préparer les données
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

    // Créer 1000 documents
    for i in 0..1000 {
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

    // Test: Performance de recherche par index
    let start = Instant::now();
    let cvs = Document::find_by_type(&pool, "CV").await.unwrap();
    let duration = start.elapsed();
    println!("Temps pour recherche par type (indexé): {:?}", duration);
    assert!(duration.as_millis() < 100);
    assert_eq!(cvs.len(), 500);

    // Test: Performance de recherche sans index
    let start = Instant::now();
    let documents = Document::find_by_content(&pool, "Content 1").await.unwrap();
    let duration = start.elapsed();
    println!("Temps pour recherche par contenu (non indexé): {:?}", duration);
    assert!(duration.as_millis() < 200);
}

#[tokio::test]
async fn test_concurrent_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test: Performance des opérations concurrentes
    let start = Instant::now();
    let mut handles = vec![];
    
    for i in 0..10 {
        let pool = pool.clone();
        let handle = tokio::spawn(async move {
            // Créer un utilisateur
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
            
            // Créer 100 documents pour cet utilisateur
            for j in 0..100 {
                let document = Document {
                    id: Uuid::new_v4(),
                    name: format!("Document {} for user {}", j, i),
                    content: format!("Content {}", j),
                    document_type: if j % 2 == 0 { "CV" } else { "Lettre" }.to_string(),
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                };
                document.create(&pool).await.unwrap();
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await.unwrap();
    }
    
    let duration = start.elapsed();
    println!("Temps pour 10 utilisateurs avec 100 documents chacun (concurrent): {:?}", duration);
    assert!(duration.as_secs() < 10);
}

#[tokio::test]
async fn test_transaction_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test: Performance des transactions
    let start = Instant::now();
    
    let result = pool.transaction(|tx| async move {
        // Créer 1000 utilisateurs dans une transaction
        for i in 0..1000 {
            let user = User {
                id: Uuid::new_v4(),
                email: format!("transaction{}@example.com", i),
                password_hash: "hashed_password".to_string(),
                first_name: format!("Transaction{}", i),
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
    println!("Temps pour 1000 insertions en transaction: {:?}", duration);
    assert!(duration.as_secs() < 5);
}

#[tokio::test]
async fn test_mixed_workload_performance() {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
    
    // Test: Performance d'une charge de travail mixte
    let start = Instant::now();
    
    // Créer 100 utilisateurs
    for i in 0..100 {
        let user = User {
            id: Uuid::new_v4(),
            email: format!("mixed{}@example.com", i),
            password_hash: "hashed_password".to_string(),
            first_name: format!("Mixed{}", i),
            last_name: "User".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        user.create(&pool).await.unwrap();
        
        // Pour chaque utilisateur, créer 10 documents
        for j in 0..10 {
            let document = Document {
                id: Uuid::new_v4(),
                name: format!("Document {} for user {}", j, i),
                content: format!("Content {}", j),
                document_type: if j % 2 == 0 { "CV" } else { "Lettre" }.to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            document.create(&pool).await.unwrap();
        }
    }
    
    let duration = start.elapsed();
    println!("Temps pour charge de travail mixte (100 utilisateurs, 10 documents chacun): {:?}", duration);
    assert!(duration.as_secs() < 10);
} 