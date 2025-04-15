use crate::commands::*;
use crate::models::*;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

fn setup_test_db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    
    // Créer les tables nécessaires pour les tests
    conn.execute(
        "CREATE TABLE user_profile (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            primary_home TEXT NOT NULL,
            secondary_home TEXT,
            cv_path TEXT,
            cv_last_updated TEXT
        )",
        [],
    ).unwrap();

    conn.execute(
        "CREATE TABLE jobs (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            source TEXT NOT NULL,
            published_at TEXT NOT NULL,
            matching_score REAL NOT NULL
        )",
        [],
    ).unwrap();

    conn
}

#[test]
fn test_get_user_profile() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Insérer un profil de test
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO user_profile (id, name, email, phone, primary_home, secondary_home) 
         VALUES (1, 'Test User', 'test@example.com', '+33612345678', 'Paris', 'Lyon')",
        [],
    ).unwrap();

    let result = get_user_profile(state).unwrap();
    assert_eq!(result.id, 1);
    assert_eq!(result.name, "Test User");
    assert_eq!(result.email, Some("test@example.com".to_string()));
    assert_eq!(result.phone, Some("+33612345678".to_string()));
}

#[test]
fn test_search_jobs() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Insérer des offres d'emploi de test
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO jobs (id, title, company, location, description, url, source, published_at, matching_score) 
         VALUES (1, 'Software Engineer', 'Tech Corp', 'Paris', 'Looking for a skilled software engineer', 
                'https://example.com/job/1', 'LinkedIn', '2024-03-21', 0.85)",
        [],
    ).unwrap();

    let criteria = SearchCriteria {
        keywords: Some(vec!["software".to_string()]),
        location: Some("Paris".to_string()),
        min_salary: None,
        max_salary: None,
        remote_only: Some(false),
    };

    let result = search_jobs(state, criteria).unwrap();
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Software Engineer");
    assert_eq!(result[0].company, "Tech Corp");
    assert_eq!(result[0].matching_score, 0.85);
}

#[test]
fn test_get_job_stats() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Insérer des données de test
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO jobs (id, title, company, location, description, url, source, published_at, matching_score) 
         VALUES (1, 'Job 1', 'Company 1', 'Paris', 'Description 1', 'https://example.com/1', 'Source 1', '2024-03-21', 0.85),
                (2, 'Job 2', 'Company 2', 'Lyon', 'Description 2', 'https://example.com/2', 'Source 2', '2024-03-22', 0.75)",
        [],
    ).unwrap();

    let result = get_job_stats(state).unwrap();
    assert_eq!(result.total_jobs, 2);
    assert_eq!(result.trend_data.labels.len(), 2);
    assert_eq!(result.source_distribution.labels.len(), 2);
}

#[test]
fn test_update_user_profile() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Insérer un profil initial
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO user_profile (id, name, email, phone, primary_home, secondary_home) 
         VALUES (1, 'Initial User', 'initial@example.com', '+33600000000', 'Paris', 'Lyon')",
        [],
    ).unwrap();

    // Mettre à jour le profil
    let updated_profile = UserProfile {
        id: 1,
        name: "Updated User".to_string(),
        email: Some("updated@example.com".to_string()),
        phone: Some("+33699999999".to_string()),
        locations: UserLocations {
            primary: "Lyon".to_string(),
            secondary: Some("Paris".to_string()),
            coordinates: None,
        },
        cv: CVInfo {
            path: std::path::PathBuf::from("new_cv.pdf"),
            last_updated: "2024-03-22".to_string(),
            skills: None,
            experience_years: None,
            education: None,
            certifications: None,
        },
        preferences: None,
        job_preferences: None,
    };

    update_user_profile(state.clone(), updated_profile.clone()).unwrap();

    // Vérifier les modifications
    let result = get_user_profile(state).unwrap();
    assert_eq!(result.name, "Updated User");
    assert_eq!(result.email, Some("updated@example.com".to_string()));
    assert_eq!(result.phone, Some("+33699999999".to_string()));
}

#[test]
fn test_get_kanban_columns() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Créer les tables nécessaires
    state.db_connection.lock().unwrap().execute(
        "CREATE TABLE kanban_columns (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            position INTEGER NOT NULL,
            color TEXT,
            card_limit INTEGER
        )",
        [],
    ).unwrap();

    state.db_connection.lock().unwrap().execute(
        "CREATE TABLE kanban_cards (
            id INTEGER PRIMARY KEY,
            job_id INTEGER NOT NULL,
            column_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            notes TEXT,
            applied_at TEXT,
            follow_up_date TEXT,
            FOREIGN KEY (column_id) REFERENCES kanban_columns(id)
        )",
        [],
    ).unwrap();

    // Insérer des données de test
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO kanban_columns (id, name, position, color, card_limit) 
         VALUES (1, 'Applied', 1, '#FF0000', 10),
                (2, 'Interview', 2, '#00FF00', 5)",
        [],
    ).unwrap();

    let result = get_kanban_columns(state).unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].name, "Applied");
    assert_eq!(result[1].name, "Interview");
}

#[test]
fn test_move_kanban_card() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Créer les tables nécessaires
    state.db_connection.lock().unwrap().execute(
        "CREATE TABLE kanban_columns (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            position INTEGER NOT NULL
        )",
        [],
    ).unwrap();

    state.db_connection.lock().unwrap().execute(
        "CREATE TABLE kanban_cards (
            id INTEGER PRIMARY KEY,
            job_id INTEGER NOT NULL,
            column_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            FOREIGN KEY (column_id) REFERENCES kanban_columns(id)
        )",
        [],
    ).unwrap();

    // Insérer des données de test
    state.db_connection.lock().unwrap().execute(
        "INSERT INTO kanban_columns (id, name, position) 
         VALUES (1, 'Applied', 1),
                (2, 'Interview', 2)",
        [],
    ).unwrap();

    state.db_connection.lock().unwrap().execute(
        "INSERT INTO kanban_cards (id, job_id, column_id, position) 
         VALUES (1, 1, 1, 1)",
        [],
    ).unwrap();

    let result = move_kanban_card(state.clone(), 1, 2, 1).unwrap();
    assert!(result);

    // Vérifier le déplacement
    let new_column: i32 = state.db_connection.lock().unwrap().query_row(
        "SELECT column_id FROM kanban_cards WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap();
    assert_eq!(new_column, 2);
}

#[test]
fn test_error_cases() {
    let conn = setup_test_db();
    let state = State::new(AppState {
        python_path: Mutex::new("python3".to_string()),
        app_path: Mutex::new(".".to_string()),
        db_connection: Mutex::new(conn),
    });

    // Test avec une base de données vide
    let result = get_user_profile(state.clone());
    assert!(result.is_err());

    // Test avec des données invalides
    let invalid_profile = UserProfile {
        id: 1,
        name: "".to_string(), // Nom vide
        email: None,
        phone: None,
        locations: UserLocations {
            primary: "".to_string(), // Adresse vide
            secondary: None,
            coordinates: None,
        },
        cv: CVInfo {
            path: std::path::PathBuf::from(""),
            last_updated: "".to_string(),
            skills: None,
            experience_years: None,
            education: None,
            certifications: None,
        },
        preferences: None,
        job_preferences: None,
    };

    let result = update_user_profile(state.clone(), invalid_profile);
    assert!(result.is_err());

    // Test avec un ID inexistant
    let result = move_kanban_card(state.clone(), 999, 1, 1);
    assert!(result.is_err());
} 