use crate::models::search_preference::SearchPreference;
use crate::models::traits::DatabaseModel;
use crate::types::DbPool;
use chrono::{DateTime, Utc};
use sqlx::sqlite::SqlitePool;
use uuid::Uuid;

#[tokio::test]
async fn test_search_preference_crud() {
    // Initialiser la base de données de test
    let pool = SqlitePool::connect(":memory:").await.unwrap();
    
    // Créer la table
    sqlx::query(
        r#"
        CREATE TABLE search_preferences (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            keywords TEXT NOT NULL,
            radius INTEGER NOT NULL,
            experience_level TEXT NOT NULL,
            remote_preference TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await
    .unwrap();

    // Créer une préférence de recherche
    let now = Utc::now();
    let preference = SearchPreference {
        id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        keywords: "rust, python".to_string(),
        radius: 50,
        experience_level: "Senior".to_string(),
        remote_preference: "Hybrid".to_string(),
        created_at: now,
        updated_at: now,
    };

    // Test de création
    preference.create(&pool).await.unwrap();

    // Test de récupération
    let retrieved = SearchPreference::find_by_id(&pool, &preference.id.to_string())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(retrieved.id, preference.id);
    assert_eq!(retrieved.user_id, preference.user_id);
    assert_eq!(retrieved.keywords, preference.keywords);
    assert_eq!(retrieved.radius, preference.radius);
    assert_eq!(retrieved.experience_level, preference.experience_level);
    assert_eq!(retrieved.remote_preference, preference.remote_preference);

    // Test de mise à jour
    let updated = SearchPreference {
        keywords: "rust, python, typescript".to_string(),
        radius: 100,
        ..preference
    };
    updated.update(&pool).await.unwrap();

    let retrieved = SearchPreference::find_by_id(&pool, &preference.id.to_string())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(retrieved.keywords, "rust, python, typescript");
    assert_eq!(retrieved.radius, 100);

    // Test de suppression
    preference.delete(&pool, &preference.id.to_string())
        .await
        .unwrap();
    let retrieved = SearchPreference::find_by_id(&pool, &preference.id.to_string())
        .await
        .unwrap();
    assert!(retrieved.is_none());
}

#[tokio::test]
async fn test_find_by_user_id() {
    // Initialiser la base de données de test
    let pool = SqlitePool::connect(":memory:").await.unwrap();
    
    // Créer la table
    sqlx::query(
        r#"
        CREATE TABLE search_preferences (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            keywords TEXT NOT NULL,
            radius INTEGER NOT NULL,
            experience_level TEXT NOT NULL,
            remote_preference TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await
    .unwrap();

    // Créer un utilisateur
    let user_id = Uuid::new_v4();
    let now = Utc::now();

    // Créer deux préférences pour le même utilisateur
    let preference1 = SearchPreference {
        id: Uuid::new_v4(),
        user_id,
        keywords: "rust".to_string(),
        radius: 50,
        experience_level: "Senior".to_string(),
        remote_preference: "Hybrid".to_string(),
        created_at: now,
        updated_at: now,
    };

    let preference2 = SearchPreference {
        id: Uuid::new_v4(),
        user_id,
        keywords: "python".to_string(),
        radius: 100,
        experience_level: "Mid".to_string(),
        remote_preference: "Remote".to_string(),
        created_at: now,
        updated_at: now,
    };

    preference1.create(&pool).await.unwrap();
    preference2.create(&pool).await.unwrap();

    // Test de récupération par user_id
    let retrieved = SearchPreference::find_by_user_id(&pool, &user_id.to_string())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(retrieved.user_id, user_id);
    assert_eq!(retrieved.keywords, "python"); // La dernière préférence créée
} 