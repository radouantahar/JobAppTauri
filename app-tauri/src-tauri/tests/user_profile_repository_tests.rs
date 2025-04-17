use anyhow::Result;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;
use serde_json::json;

use app_tauri::db::user_repository::UserRepository;
use app_tauri::db::user_profile_repository::UserProfileRepository;
use app_tauri::models::user::User;
use app_tauri::models::user_profile::{UserProfile, NewUserProfile, UpdateUserProfile};

async fn setup_db() -> Result<SqlitePool> {
    let pool = SqlitePool::connect(":memory:").await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

async fn create_test_user(pool: &SqlitePool) -> Result<User> {
    let user_repo = UserRepository::new(pool.clone());
    let new_user = NewUser {
        username: "test_user".to_string(),
        email: "test@example.com".to_string(),
        password: "password123".to_string(),
    };
    user_repo.create_user(new_user).await
}

#[tokio::test]
async fn test_create_user_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user_repo = UserRepository::new(pool.clone());
    let profile_repo = UserProfileRepository::new(pool);

    // Créer un utilisateur
    let user = User {
        id: Uuid::new_v4().to_string(),
        email: "test@example.com".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    user_repo.create_user(&user).await?;

    // Créer un profil
    let profile = UserProfile {
        id: Uuid::new_v4().to_string(),
        user_id: user.id.clone(),
        first_name: "John".to_string(),
        last_name: "Doe".to_string(),
        phone: Some("1234567890".to_string()),
        location: Some("Paris".to_string()),
        primary_home: Some("France".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let created_profile = profile_repo.create_user_profile(&profile).await?;
    assert_eq!(created_profile.first_name, profile.first_name);
    assert_eq!(created_profile.last_name, profile.last_name);
    assert_eq!(created_profile.user_id, profile.user_id);

    Ok(())
}

#[tokio::test]
async fn test_get_user_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user_repo = UserRepository::new(pool.clone());
    let profile_repo = UserProfileRepository::new(pool);

    // Créer un utilisateur
    let user = User {
        id: Uuid::new_v4().to_string(),
        email: "test@example.com".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    user_repo.create_user(&user).await?;

    // Créer un profil
    let profile = UserProfile {
        id: Uuid::new_v4().to_string(),
        user_id: user.id.clone(),
        first_name: "John".to_string(),
        last_name: "Doe".to_string(),
        phone: Some("1234567890".to_string()),
        location: Some("Paris".to_string()),
        primary_home: Some("France".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    profile_repo.create_user_profile(&profile).await?;

    // Récupérer le profil
    let retrieved_profile = profile_repo.get_user_profile(&profile.id).await?;
    assert!(retrieved_profile.is_some());
    let retrieved_profile = retrieved_profile.unwrap();
    assert_eq!(retrieved_profile.first_name, profile.first_name);
    assert_eq!(retrieved_profile.last_name, profile.last_name);
    assert_eq!(retrieved_profile.user_id, profile.user_id);

    Ok(())
}

#[tokio::test]
async fn test_update_user_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user_repo = UserRepository::new(pool.clone());
    let profile_repo = UserProfileRepository::new(pool);

    // Créer un utilisateur
    let user = User {
        id: Uuid::new_v4().to_string(),
        email: "test@example.com".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    user_repo.create_user(&user).await?;

    // Créer un profil
    let profile = UserProfile {
        id: Uuid::new_v4().to_string(),
        user_id: user.id.clone(),
        first_name: "John".to_string(),
        last_name: "Doe".to_string(),
        phone: Some("1234567890".to_string()),
        location: Some("Paris".to_string()),
        primary_home: Some("France".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    profile_repo.create_user_profile(&profile).await?;

    // Mettre à jour le profil
    let mut updated_profile = profile.clone();
    updated_profile.first_name = "Jane".to_string();
    updated_profile.last_name = "Smith".to_string();
    updated_profile.phone = Some("0987654321".to_string());

    let result = profile_repo.update_user_profile(&updated_profile).await?;
    assert_eq!(result.first_name, "Jane");
    assert_eq!(result.last_name, "Smith");
    assert_eq!(result.phone, Some("0987654321".to_string()));

    Ok(())
}

#[tokio::test]
async fn test_delete_user_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user_repo = UserRepository::new(pool.clone());
    let profile_repo = UserProfileRepository::new(pool);

    // Créer un utilisateur
    let user = User {
        id: Uuid::new_v4().to_string(),
        email: "test@example.com".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    user_repo.create_user(&user).await?;

    // Créer un profil
    let profile = UserProfile {
        id: Uuid::new_v4().to_string(),
        user_id: user.id.clone(),
        first_name: "John".to_string(),
        last_name: "Doe".to_string(),
        phone: Some("1234567890".to_string()),
        location: Some("Paris".to_string()),
        primary_home: Some("France".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    profile_repo.create_user_profile(&profile).await?;

    // Supprimer le profil
    profile_repo.delete_user_profile(&profile.id).await?;

    // Vérifier que le profil n'existe plus
    let retrieved_profile = profile_repo.get_user_profile(&profile.id).await?;
    assert!(retrieved_profile.is_none());

    Ok(())
}

#[tokio::test]
async fn test_create_and_get_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un nouveau profil
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("John Doe".to_string()),
        current_position: Some("Développeur Senior".to_string()),
        summary: Some("Développeur expérimenté en Rust".to_string()),
        skills: json!(["Rust", "Python", "SQL"]),
        experiences: json!([
            {
                "title": "Développeur Senior",
                "company": "Tech Corp",
                "start_date": "2020-01-01",
                "end_date": null
            }
        ]),
        education: json!([
            {
                "degree": "Master en Informatique",
                "school": "Université Paris",
                "year": 2015
            }
        ]),
        languages: json!([
            {
                "name": "Français",
                "level": "Natif"
            },
            {
                "name": "Anglais",
                "level": "Courant"
            }
        ]),
    };

    // Test de création
    let created_profile = repo.create_profile(new_profile).await?;
    assert_eq!(created_profile.user_id, user.id);
    assert_eq!(created_profile.full_name, Some("John Doe".to_string()));
    assert_eq!(created_profile.current_position, Some("Développeur Senior".to_string()));

    // Test de récupération par ID
    let retrieved_profile = repo.get_profile(created_profile.id).await?.unwrap();
    assert_eq!(retrieved_profile.id, created_profile.id);
    assert_eq!(retrieved_profile.user_id, user.id);

    Ok(())
}

#[tokio::test]
async fn test_get_profile_by_user_id() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un profil
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("Jane Smith".to_string()),
        current_position: Some("Product Manager".to_string()),
        summary: Some("Product Manager expérimentée".to_string()),
        skills: json!(["Product Management", "Agile"]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;

    // Test de récupération par user_id
    let retrieved_profile = repo.get_profile_by_user_id(user.id).await?.unwrap();
    assert_eq!(retrieved_profile.id, created_profile.id);
    assert_eq!(retrieved_profile.user_id, user.id);

    Ok(())
}

#[tokio::test]
async fn test_update_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un profil initial
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("Initial Name".to_string()),
        current_position: Some("Initial Position".to_string()),
        summary: Some("Initial Summary".to_string()),
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;

    // Mise à jour du profil
    let update = UpdateUserProfile {
        full_name: Some("Updated Name".to_string()),
        current_position: Some("Updated Position".to_string()),
        summary: Some("Updated Summary".to_string()),
        skills: Some(json!(["New Skill"])),
        experiences: None,
        education: None,
        languages: None,
    };

    let updated_profile = repo.update_profile(created_profile.id, update).await?.unwrap();
    assert_eq!(updated_profile.full_name, Some("Updated Name".to_string()));
    assert_eq!(updated_profile.current_position, Some("Updated Position".to_string()));
    assert_eq!(updated_profile.summary, Some("Updated Summary".to_string()));

    Ok(())
}

#[tokio::test]
async fn test_delete_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un profil
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("To Delete".to_string()),
        current_position: Some("Position".to_string()),
        summary: Some("Summary".to_string()),
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;

    // Test de suppression
    let delete_result = repo.delete_profile(created_profile.id).await?;
    assert!(delete_result);

    // Vérification que le profil n'existe plus
    let retrieved_profile = repo.get_profile(created_profile.id).await?;
    assert!(retrieved_profile.is_none());

    Ok(())
}

#[tokio::test]
async fn test_nonexistent_profile() -> Result<()> {
    let pool = setup_db().await?;
    let repo = UserProfileRepository::new(pool);
    
    // Test de récupération d'un profil inexistant
    let retrieved_profile = repo.get_profile(999).await?;
    assert!(retrieved_profile.is_none());

    // Test de mise à jour d'un profil inexistant
    let update = UpdateUserProfile {
        full_name: Some("New Name".to_string()),
        current_position: None,
        summary: None,
        skills: None,
        experiences: None,
        education: None,
        languages: None,
    };

    let updated_profile = repo.update_profile(999, update).await?;
    assert!(updated_profile.is_none());

    // Test de suppression d'un profil inexistant
    let delete_result = repo.delete_profile(999).await?;
    assert!(!delete_result);

    Ok(())
}

#[tokio::test]
async fn test_foreign_key_constraint() -> Result<()> {
    let pool = setup_db().await?;
    let repo = UserProfileRepository::new(pool);
    
    // Tentative de création d'un profil avec un user_id inexistant
    let new_profile = NewUserProfile {
        user_id: 999, // ID inexistant
        full_name: Some("Test User".to_string()),
        current_position: Some("Position".to_string()),
        summary: Some("Summary".to_string()),
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    // La création devrait échouer à cause de la contrainte de clé étrangère
    let result = repo.create_profile(new_profile).await;
    assert!(result.is_err());

    Ok(())
}

#[tokio::test]
async fn test_invalid_json_data() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Tentative de création d'un profil avec des données JSON invalides
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("Test User".to_string()),
        current_position: Some("Position".to_string()),
        summary: Some("Summary".to_string()),
        skills: json!("invalid"), // Chaîne au lieu d'un tableau
        experiences: json!(null), // null au lieu d'un tableau
        education: json!(123), // nombre au lieu d'un tableau
        languages: json!({}), // objet au lieu d'un tableau
    };

    // La création devrait échouer à cause des données JSON invalides
    let result = repo.create_profile(new_profile).await;
    assert!(result.is_err());

    Ok(())
}

#[tokio::test]
async fn test_empty_profile() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un profil avec des champs vides
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: None,
        current_position: None,
        summary: None,
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;
    assert!(created_profile.full_name.is_none());
    assert!(created_profile.current_position.is_none());
    assert!(created_profile.summary.is_none());

    Ok(())
}

#[tokio::test]
async fn test_max_length_fields() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool);
    
    // Création d'un profil avec des champs de longueur maximale
    let long_string = "a".repeat(1000); // Chaîne très longue
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some(long_string.clone()),
        current_position: Some(long_string.clone()),
        summary: Some(long_string),
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;
    assert_eq!(created_profile.full_name.unwrap().len(), 1000);
    assert_eq!(created_profile.current_position.unwrap().len(), 1000);
    assert_eq!(created_profile.summary.unwrap().len(), 1000);

    Ok(())
}

#[tokio::test]
async fn test_concurrent_updates() -> Result<()> {
    let pool = setup_db().await?;
    let user = create_test_user(&pool).await?;
    let repo = UserProfileRepository::new(pool.clone());
    
    // Création d'un profil initial
    let new_profile = NewUserProfile {
        user_id: user.id,
        full_name: Some("Initial Name".to_string()),
        current_position: Some("Initial Position".to_string()),
        summary: Some("Initial Summary".to_string()),
        skills: json!([]),
        experiences: json!([]),
        education: json!([]),
        languages: json!([]),
    };

    let created_profile = repo.create_profile(new_profile).await?;

    // Mise à jour concurrente 1
    let update1 = UpdateUserProfile {
        full_name: Some("Update 1".to_string()),
        current_position: None,
        summary: None,
        skills: None,
        experiences: None,
        education: None,
        languages: None,
    };

    // Mise à jour concurrente 2
    let update2 = UpdateUserProfile {
        full_name: Some("Update 2".to_string()),
        current_position: None,
        summary: None,
        skills: None,
        experiences: None,
        education: None,
        languages: None,
    };

    // Exécution des mises à jour concurrentes
    let (result1, result2) = tokio::join!(
        repo.update_profile(created_profile.id, update1),
        repo.update_profile(created_profile.id, update2)
    );

    // Au moins une des mises à jour devrait réussir
    assert!(result1.is_ok() || result2.is_ok());

    Ok(())
} 