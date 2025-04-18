use crate::commands::search::{search_jobs, SearchCriteria};
use crate::AppState;
use tauri_plugin_sql::TauriSql;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search_jobs() {
        let db = TauriSql::default();
        let criteria = SearchCriteria {
            keywords: vec!["developer".to_string()],
            location: Some("Paris".to_string()),
            radius: Some(50),
            min_salary: Some(40000.0),
            job_type: Some("CDI".to_string()),
            experience_level: Some("Mid".to_string()),
            remote_preference: Some("Hybrid".to_string()),
            date_posted: Some("7d".to_string()),
        };
        let result = search_jobs(db, criteria).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_search_preferences() {
        let db = TauriSql::default();
        let result = get_search_preferences(db).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_update_search_preferences() {
        let db = TauriSql::default();
        let preferences = SearchPreference {
            id: 1,
            keywords: vec!["rust".to_string(), "python".to_string()],
            location: Some("Lyon".to_string()),
            radius: Some(30),
            min_salary: Some(45000.0),
            job_type: Some("CDI".to_string()),
            experience_level: Some("Senior".to_string()),
            remote_preference: Some("Remote".to_string()),
            date_posted: Some("30d".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let result = update_search_preferences(db, preferences).await;
        assert!(result.is_ok());
    }
}

#[tokio::test]
async fn test_search_jobs() {
    // Créer une connexion à la base de données
    let db = TauriSql::default();
    let conn = db.get("sqlite:test.db").unwrap();
    
    // Créer la table jobs
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
            source TEXT NOT NULL
        )",
        &[],
    )
    .unwrap();

    // Insérer des données de test
    conn.execute(
        "INSERT INTO jobs (
            title, company, location, job_type, salary_min, salary_max,
            description, url, posted_at, experience_level, skills, remote, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            &"Développeur React",
            &"Tech Corp",
            &"Paris",
            &"CDI",
            &40000,
            &60000,
            &"Description du poste",
            &"https://example.com/job",
            &"2024-01-01",
            &"mid",
            &r#"["React", "TypeScript"]"#,
            &true,
            &"linkedin"
        ],
    )
    .unwrap();

    // Créer l'état de l'application
    let state = AppState {
        db: Arc::new(Mutex::new(Some(db))),
    };

    // Test 1: Recherche par mot-clé
    let criteria = SearchCriteria {
        keywords: vec!["React".to_string()],
        location: None,
        radius: None,
        min_salary: None,
        job_type: None,
        experience_level: None,
        remote_preference: None,
        date_posted: None,
    };

    let results = search_jobs(state.clone(), criteria).await.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].title, "Développeur React");

    // Test 2: Recherche par localisation
    let criteria = SearchCriteria {
        keywords: vec![],
        location: Some("Paris".to_string()),
        radius: None,
        min_salary: None,
        job_type: None,
        experience_level: None,
        remote_preference: None,
        date_posted: None,
    };

    let results = search_jobs(state.clone(), criteria).await.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].location, "Paris");

    // Test 3: Recherche par type de contrat
    let criteria = SearchCriteria {
        keywords: vec![],
        location: None,
        radius: None,
        min_salary: None,
        job_type: Some("CDI".to_string()),
        experience_level: None,
        remote_preference: None,
        date_posted: None,
    };

    let results = search_jobs(state.clone(), criteria).await.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].job_type, "CDI");

    // Test 4: Recherche par salaire
    let criteria = SearchCriteria {
        keywords: vec![],
        location: None,
        radius: None,
        min_salary: Some(35000.0),
        job_type: None,
        experience_level: None,
        remote_preference: None,
        date_posted: None,
    };

    let results = search_jobs(state.clone(), criteria).await.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].salary_min, Some(40000));
    assert_eq!(results[0].salary_max, Some(60000));

    // Test 5: Recherche par compétences
    let criteria = SearchCriteria {
        keywords: vec![],
        location: None,
        radius: None,
        min_salary: None,
        job_type: None,
        experience_level: None,
        remote_preference: None,
        date_posted: None,
    };

    let results = search_jobs(state.clone(), criteria).await.unwrap();
    assert_eq!(results.len(), 1);
    assert!(results[0].skills.contains(&"React".to_string()));
}

#[tokio::test]
async fn test_get_job_details() {
    // Créer une connexion à la base de données
    let db = TauriSql::default();
    let conn = db.get("sqlite:test.db").unwrap();
    
    // Créer la table jobs
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
            source TEXT NOT NULL
        )",
        &[],
    )
    .unwrap();

    // Insérer des données de test
    conn.execute(
        "INSERT INTO jobs (
            title, company, location, job_type, salary_min, salary_max,
            description, url, posted_at, experience_level, skills, remote, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            &"Développeur React",
            &"Tech Corp",
            &"Paris",
            &"CDI",
            &40000,
            &60000,
            &"Description du poste",
            &"https://example.com/job",
            &"2024-01-01",
            &"mid",
            &r#"["React", "TypeScript"]"#,
            &true,
            &"linkedin"
        ],
    )
    .unwrap();

    // Créer l'état de l'application
    let state = AppState {
        db: Arc::new(Mutex::new(Some(db))),
    };

    // Test 1: Récupérer un job existant
    let job = crate::commands::search::get_job_details(state.clone(), 1).await.unwrap();
    assert!(job.is_some());
    let job = job.unwrap();
    assert_eq!(job.title, "Développeur React");
    assert_eq!(job.company, "Tech Corp");
    assert_eq!(job.location, "Paris");

    // Test 2: Récupérer un job inexistant
    let job = crate::commands::search::get_job_details(state.clone(), 999).await.unwrap();
    assert!(job.is_none());
} 