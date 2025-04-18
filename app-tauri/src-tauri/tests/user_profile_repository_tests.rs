use anyhow::Result;
use chrono::Utc;
use tauri_plugin_sql::TauriSql;
use uuid::Uuid;
use serde_json::json;

use app_tauri::db::user_repository::UserRepository;
use app_tauri::db::user_profile_repository::UserProfileRepository;
use app_tauri::models::user::User;
use app_tauri::models::user_profile::{UserProfile, NewUserProfile, UpdateUserProfile};

async fn setup_test_db() -> Result<TauriSql, String> {
    let db = TauriSql::new("sqlite:test.db")?;
    let conn = db.get("sqlite:test.db")?;

    // Créer les tables nécessaires
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            location TEXT,
            bio TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
        "#,
        &[],
    )?;

    Ok(db)
}

async fn create_test_user(pool: &TauriSql) -> Result<User> {
    let user_repo = UserRepository::new(pool.clone());
    let new_user = NewUser {
        username: "test_user".to_string(),
        email: "test@example.com".to_string(),
        password: "password123".to_string(),
    };
    user_repo.create_user(new_user).await
}

#[tokio::test]
async fn test_create_user_profile() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let profile = UserProfile {
        id: Uuid::new_v4(),
        name: "Test User".to_string(),
        email: "test@example.com".to_string(),
        phone: Some("1234567890".to_string()),
        location: Some("Test Location".to_string()),
        bio: Some("Test Bio".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    conn.execute(
        r#"
        INSERT INTO user_profiles (
            id, name, email, phone, location, bio, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &profile.id.to_string(),
            &profile.name,
            &profile.email,
            &profile.phone.as_deref().unwrap_or(""),
            &profile.location.as_deref().unwrap_or(""),
            &profile.bio.as_deref().unwrap_or(""),
            &profile.created_at,
            &profile.updated_at,
        ],
    )?;

    let mut rows = conn.query(
        "SELECT * FROM user_profiles WHERE id = ?",
        &[&profile.id.to_string()],
    )?;

    let created_profile = if let Some(row) = rows.next()? {
        UserProfile {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            name: row.get("name")?,
            email: row.get("email")?,
            phone: Some(row.get("phone")?),
            location: Some(row.get("location")?),
            bio: Some(row.get("bio")?),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        }
    } else {
        return Err("Profile not found".to_string());
    };

    assert_eq!(created_profile.id, profile.id);
    assert_eq!(created_profile.name, profile.name);
    assert_eq!(created_profile.email, profile.email);

    Ok(())
}

#[tokio::test]
async fn test_get_user_profile() -> Result<()> {
    let pool = setup_test_db().await?;
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
async fn test_update_user_profile() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let profile_id = Uuid::new_v4();
    let now = Utc::now();

    // Créer un profil
    conn.execute(
        r#"
        INSERT INTO user_profiles (
            id, name, email, phone, location, bio, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &profile_id.to_string(),
            "Old Name",
            "old@example.com",
            "",
            "",
            "",
            &now,
            &now,
        ],
    )?;

    // Mettre à jour le profil
    let new_name = "New Name";
    let new_email = "new@example.com";
    let new_now = Utc::now();

    conn.execute(
        r#"
        UPDATE user_profiles 
        SET name = ?, email = ?, updated_at = ?
        WHERE id = ?
        "#,
        &[new_name, new_email, &new_now, &profile_id.to_string()],
    )?;

    // Vérifier la mise à jour
    let mut rows = conn.query(
        "SELECT * FROM user_profiles WHERE id = ?",
        &[&profile_id.to_string()],
    )?;

    let updated_profile = if let Some(row) = rows.next()? {
        UserProfile {
            id: Uuid::parse_str(&row.get::<String>("id")?).map_err(|e| e.to_string())?,
            name: row.get("name")?,
            email: row.get("email")?,
            phone: Some(row.get("phone")?),
            location: Some(row.get("location")?),
            bio: Some(row.get("bio")?),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        }
    } else {
        return Err("Profile not found".to_string());
    };

    assert_eq!(updated_profile.name, new_name);
    assert_eq!(updated_profile.email, new_email);

    Ok(())
}

#[tokio::test]
async fn test_delete_user_profile() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let profile_id = Uuid::new_v4();
    let now = Utc::now();

    // Créer un profil
    conn.execute(
        r#"
        INSERT INTO user_profiles (
            id, name, email, phone, location, bio, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        &[
            &profile_id.to_string(),
            "Test Name",
            "test@example.com",
            "",
            "",
            "",
            &now,
            &now,
        ],
    )?;

    // Supprimer le profil
    conn.execute(
        "DELETE FROM user_profiles WHERE id = ?",
        &[&profile_id.to_string()],
    )?;

    // Vérifier la suppression
    let mut rows = conn.query(
        "SELECT COUNT(*) as count FROM user_profiles WHERE id = ?",
        &[&profile_id.to_string()],
    )?;

    if let Some(row) = rows.next()? {
        let count: i64 = row.get("count")?;
        assert_eq!(count, 0);
    }

    Ok(())
}

#[tokio::test]
async fn test_create_and_get_profile() -> Result<()> {
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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
    let pool = setup_test_db().await?;
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