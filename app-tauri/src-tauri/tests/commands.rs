use crate::commands::*;
use crate::models::*;
use tauri_plugin_sql::TauriSql;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use chrono::Utc;

fn setup_test_db() -> TauriSql {
    let db = TauriSql::default();
    let conn = db.get("sqlite:test.db").unwrap();
    
    // Créer les tables nécessaires pour les tests
    conn.execute(
        "CREATE TABLE user_profiles (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            location TEXT,
            primary_home TEXT,
            secondary_home TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        &[],
    ).unwrap();

    conn.execute(
        "CREATE TABLE jobs (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            job_type TEXT NOT NULL,
            salary_min INTEGER,
            salary_max INTEGER,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            posted_at TEXT NOT NULL,
            experience_level TEXT NOT NULL,
            skills TEXT NOT NULL,
            remote BOOLEAN NOT NULL,
            source TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        &[],
    ).unwrap();

    conn.execute(
        "CREATE TABLE kanban_columns (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            position INTEGER NOT NULL,
            color TEXT,
            card_limit INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        &[],
    ).unwrap();

    conn.execute(
        "CREATE TABLE kanban_cards (
            id INTEGER PRIMARY KEY,
            job_id INTEGER NOT NULL,
            column_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            notes TEXT,
            applied_at TEXT,
            follow_up_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (column_id) REFERENCES kanban_columns(id)
        )",
        &[],
    ).unwrap();

    db
}

#[tokio::test]
async fn test_get_user_profile() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer un profil de test
    state.execute(
        "INSERT INTO user_profiles (id, user_id, first_name, last_name, email, phone, location, primary_home, secondary_home, created_at, updated_at) 
         VALUES (1, '1', 'Test', 'User', 'test@example.com', '+33612345678', 'Paris', 'Paris', 'Lyon', ?, ?)",
        &[&now, &now],
    ).unwrap();

    let result = get_user_profile(state, "1".to_string()).await.unwrap();
    assert_eq!(result.id, 1);
    assert_eq!(result.first_name, "Test");
    assert_eq!(result.last_name, "User");
    assert_eq!(result.email, Some("test@example.com".to_string()));
    assert_eq!(result.phone, Some("+33612345678".to_string()));
}

#[tokio::test]
async fn test_search_jobs() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer des offres d'emploi de test
    state.execute(
        "INSERT INTO jobs (title, company, location, job_type, salary_min, salary_max, description, url, posted_at, experience_level, skills, remote, source, created_at, updated_at) 
         VALUES ('Software Engineer', 'Tech Corp', 'Paris', 'CDI', 40000, 60000, 'Looking for a skilled software engineer', 
                'https://example.com/job/1', '2024-03-21', 'mid', '[\"React\", \"TypeScript\"]', true, 'linkedin', ?, ?)",
        &[&now, &now],
    ).unwrap();

    let criteria = SearchCriteria {
        keywords: vec!["software".to_string()],
        location: Some("Paris".to_string()),
        radius: None,
        min_salary: None,
        job_type: None,
        experience_level: None,
        remote_preference: Some("Hybrid".to_string()),
        date_posted: None,
    };

    let result = search_jobs(state, criteria).await.unwrap();
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Software Engineer");
    assert_eq!(result[0].company, "Tech Corp");
    assert_eq!(result[0].location, "Paris");
}

#[tokio::test]
async fn test_get_job_stats() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer des données de test
    state.execute(
        "INSERT INTO jobs (title, company, location, job_type, salary_min, salary_max, description, url, posted_at, experience_level, skills, remote, source, created_at, updated_at) 
         VALUES ('Job 1', 'Company 1', 'Paris', 'CDI', 40000, 60000, 'Description 1', 'https://example.com/1', '2024-03-21', 'mid', '[\"React\"]', true, 'linkedin', ?, ?),
                ('Job 2', 'Company 2', 'Lyon', 'CDI', 45000, 65000, 'Description 2', 'https://example.com/2', '2024-03-22', 'senior', '[\"Python\"]', false, 'indeed', ?, ?)",
        &[&now, &now, &now, &now],
    ).unwrap();

    let result = get_job_stats(state).await.unwrap();
    assert_eq!(result.total_jobs, 2);
    assert_eq!(result.average_salary_min, 42500.0);
    assert_eq!(result.average_salary_max, 62500.0);
}

#[tokio::test]
async fn test_update_user_profile() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer un profil initial
    state.execute(
        "INSERT INTO user_profiles (id, user_id, first_name, last_name, email, phone, location, primary_home, secondary_home, created_at, updated_at) 
         VALUES (1, '1', 'Initial', 'User', 'initial@example.com', '+33600000000', 'Paris', 'Paris', 'Lyon', ?, ?)",
        &[&now, &now],
    ).unwrap();

    // Mettre à jour le profil
    let updated_profile = UserProfile {
        id: 1,
        user_id: "1".parse().unwrap(),
        first_name: "Updated".to_string(),
        last_name: "User".to_string(),
        email: Some("updated@example.com".to_string()),
        phone: Some("+33699999999".to_string()),
        location: Some("Lyon".to_string()),
        primary_home: Some("Lyon".to_string()),
        secondary_home: Some("Paris".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    update_user_profile(state.clone(), updated_profile.clone()).await.unwrap();

    // Vérifier les modifications
    let result = get_user_profile(state, "1".to_string()).await.unwrap();
    assert_eq!(result.first_name, "Updated");
    assert_eq!(result.last_name, "User");
    assert_eq!(result.email, Some("updated@example.com".to_string()));
    assert_eq!(result.phone, Some("+33699999999".to_string()));
}

#[tokio::test]
async fn test_get_kanban_columns() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer des données de test
    state.execute(
        "INSERT INTO kanban_columns (id, name, position, color, card_limit, created_at, updated_at) 
         VALUES (1, 'Applied', 1, '#FF0000', 10, ?, ?),
                (2, 'Interview', 2, '#00FF00', 5, ?, ?)",
        &[&now, &now, &now, &now],
    ).unwrap();

    let result = get_kanban_columns(state, "1".to_string()).await.unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].name, "Applied");
    assert_eq!(result[1].name, "Interview");
}

#[tokio::test]
async fn test_move_kanban_card() {
    let db = setup_test_db();
    let state = State::new(db);

    let now = Utc::now().to_rfc3339();
    
    // Insérer des données de test
    state.execute(
        "INSERT INTO kanban_columns (id, name, position, created_at, updated_at) 
         VALUES (1, 'Applied', 1, ?, ?),
                (2, 'Interview', 2, ?, ?)",
        &[&now, &now, &now, &now],
    ).unwrap();

    state.execute(
        "INSERT INTO kanban_cards (id, job_id, column_id, position, created_at, updated_at) 
         VALUES (1, 1, 1, 1, ?, ?)",
        &[&now, &now],
    ).unwrap();

    move_kanban_card(state.clone(), "1".to_string(), "1".to_string(), "2".to_string()).await.unwrap();

    // Vérifier le déplacement
    let mut rows = state.query(
        "SELECT column_id FROM kanban_cards WHERE id = ?",
        &[&"1"],
    ).unwrap();

    if let Some(row) = rows.next().unwrap() {
        assert_eq!(row.get::<i32>("column_id"), 2);
    } else {
        panic!("Carte non trouvée");
    }
}

#[test]
fn test_error_cases() {
    let db = setup_test_db();
    let state = State::new(db);

    // Test avec une base de données vide
    let result = get_user_profile(state.clone(), "1".to_string());
    assert!(result.is_err());

    // Test avec des données invalides
    let invalid_profile = UserProfile {
        id: 1,
        user_id: "1".parse().unwrap(),
        first_name: "".to_string(), // Nom vide
        last_name: "".to_string(), // Nom vide
        phone: None,
        location: None,
        primary_home: None,
        secondary_home: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let result = update_user_profile(state.clone(), invalid_profile);
    assert!(result.is_err());

    // Test avec un ID inexistant
    let result = move_kanban_card(state.clone(), "1".to_string(), "1".to_string(), "999".to_string());
    assert!(result.is_err());
} 