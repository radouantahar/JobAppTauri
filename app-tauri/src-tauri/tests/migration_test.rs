use tauri_plugin_sql::TauriSql;
use rusqlite::Connection;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_migration() {
        // Créer une base de données en mémoire
        let conn = Connection::open_in_memory().unwrap();

        // Exécuter la migration
        conn.execute_batch(
            r#"
            -- Création de la table users
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            -- Création de la table jobs
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL,
                job_type TEXT NOT NULL,
                salary_min INTEGER,
                salary_max INTEGER,
                description TEXT NOT NULL,
                url TEXT NOT NULL,
                posted_at TIMESTAMP NOT NULL,
                experience_level TEXT NOT NULL,
                skills TEXT NOT NULL,
                remote BOOLEAN NOT NULL DEFAULT FALSE,
                source TEXT NOT NULL
            );

            -- Création de la table applications
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                applied_date TIMESTAMP NOT NULL,
                notes TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );

            -- Création de la table documents
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                document_type TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            "#
        ).unwrap();

        // Vérifier que les tables ont été créées
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'").unwrap();
        let tables: Vec<String> = stmt.query_map([], |row| row.get(0)).unwrap().collect::<Result<_, _>>().unwrap();

        assert!(tables.contains(&"users".to_string()));
        assert!(tables.contains(&"jobs".to_string()));
        assert!(tables.contains(&"applications".to_string()));
        assert!(tables.contains(&"documents".to_string()));

        // Vérifier la structure de la table users
        let mut stmt = conn.prepare("PRAGMA table_info(users)").unwrap();
        let columns: Vec<(i32, String, String, bool, Option<String>, bool)> = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        }).unwrap().collect::<Result<_, _>>().unwrap();

        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "email"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "password"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "first_name"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "last_name"));

        // Vérifier la structure de la table applications
        let mut stmt = conn.prepare("PRAGMA table_info(applications)").unwrap();
        let columns: Vec<(i32, String, String, bool, Option<String>, bool)> = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        }).unwrap().collect::<Result<_, _>>().unwrap();

        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "user_id"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "job_id"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "status"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "applied_date"));
        assert!(columns.iter().any(|(_, name, _, _, _, _)| name == "notes"));
    }

    #[test]
    fn test_foreign_key_constraints() {
        let conn = Connection::open_in_memory().unwrap();

        // Activer les contraintes de clé étrangère
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();

        // Exécuter la migration
        conn.execute_batch(
            r#"
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL
            );

            CREATE TABLE jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL
            );

            CREATE TABLE applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
            "#
        ).unwrap();

        // Tenter d'insérer une application avec des IDs invalides
        let result = conn.execute(
            "INSERT INTO applications (user_id, job_id) VALUES (?, ?)",
            [1, 1]
        );

        assert!(result.is_err());
    }
} 