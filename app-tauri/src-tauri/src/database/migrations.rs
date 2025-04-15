use rusqlite::{Connection, Result};

pub struct Migration {
    pub version: i32,
    pub description: &'static str,
    pub up: &'static str,
    pub down: &'static str,
}

impl Migration {
    pub fn execute(&self, conn: &Connection) -> Result<()> {
        conn.execute(self.up, [])?;
        Ok(())
    }

    pub fn rollback(&self, conn: &Connection) -> Result<()> {
        conn.execute(self.down, [])?;
        Ok(())
    }
}

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Création des tables initiales",
            up: "
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                INSERT INTO schema_version (version) VALUES (1);
            ",
            down: "
                DROP TABLE IF EXISTS schema_version;
            ",
        },
        Migration {
            version: 2,
            description: "Ajout de l'index sur l'email des utilisateurs",
            up: "
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                INSERT INTO schema_version (version) VALUES (2);
            ",
            down: "
                DROP INDEX IF EXISTS idx_users_email;
                DELETE FROM schema_version WHERE version = 2;
            ",
        },
        Migration {
            version: 3,
            description: "Ajout de l'index sur le statut des jobs",
            up: "
                CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
                INSERT INTO schema_version (version) VALUES (3);
            ",
            down: "
                DROP INDEX IF EXISTS idx_jobs_status;
                DELETE FROM schema_version WHERE version = 3;
            ",
        },
        Migration {
            version: 4,
            description: "Ajout de l'index sur le score de correspondance des jobs",
            up: "
                CREATE INDEX IF NOT EXISTS idx_jobs_matching_score ON jobs(matching_score);
                INSERT INTO schema_version (version) VALUES (4);
            ",
            down: "
                DROP INDEX IF EXISTS idx_jobs_matching_score;
                DELETE FROM schema_version WHERE version = 4;
            ",
        },
        Migration {
            version: 5,
            description: "Ajout d'index pour les requêtes de recherche",
            up: "
                CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
                CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
                CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
                CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
                CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
                INSERT INTO schema_version (version) VALUES (5);
            ",
            down: "
                DROP INDEX IF EXISTS idx_jobs_title;
                DROP INDEX IF EXISTS idx_jobs_company;
                DROP INDEX IF EXISTS idx_jobs_location;
                DROP INDEX IF EXISTS idx_documents_user_id;
                DROP INDEX IF EXISTS idx_documents_type;
                DELETE FROM schema_version WHERE version = 5;
            ",
        },
        Migration {
            version: 6,
            description: "Ajout d'index pour les requêtes de jointure",
            up: "
                CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
                CREATE INDEX IF NOT EXISTS idx_kanban_cards_job_id ON kanban_cards(job_id);
                CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
                INSERT INTO schema_version (version) VALUES (6);
            ",
            down: "
                DROP INDEX IF EXISTS idx_jobs_user_id;
                DROP INDEX IF EXISTS idx_kanban_cards_job_id;
                DROP INDEX IF EXISTS idx_kanban_cards_column_id;
                DELETE FROM schema_version WHERE version = 6;
            ",
        }
    ]
}

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Vérifier si la table schema_version existe
    let table_exists: bool = conn
        .query_row(
            "SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_version')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !table_exists {
        // Exécuter la première migration qui crée la table schema_version
        let first_migration = get_migrations().first().unwrap();
        first_migration.execute(conn)?;
    }

    // Récupérer la version actuelle
    let current_version: i32 = conn
        .query_row("SELECT MAX(version) FROM schema_version", [], |row| row.get(0))
        .unwrap_or(0);

    // Exécuter les migrations en attente
    for migration in get_migrations() {
        if migration.version > current_version {
            migration.execute(conn)?;
        }
    }

    Ok(())
} 