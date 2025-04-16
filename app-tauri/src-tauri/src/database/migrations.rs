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
            description: "Ajout des tables pour le suivi des candidatures",
            up: "
                -- Table des candidatures
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    job_id INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    applied_at TIMESTAMP,
                    response_received BOOLEAN DEFAULT FALSE,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                );

                -- Table des étapes de candidature
                CREATE TABLE IF NOT EXISTS application_stages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    stage_type TEXT NOT NULL,
                    scheduled_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    notes TEXT,
                    outcome TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications(id)
                );

                -- Table des documents de candidature
                CREATE TABLE IF NOT EXISTS application_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    document_type TEXT NOT NULL,
                    file_path TEXT,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications(id)
                );

                -- Table des notes de candidature
                CREATE TABLE IF NOT EXISTS application_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications(id)
                );

                -- Création des index
                CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
                CREATE INDEX IF NOT EXISTS idx_applications_user_job ON applications(user_id, job_id);
                CREATE INDEX IF NOT EXISTS idx_application_stages_type ON application_stages(stage_type);
                CREATE INDEX IF NOT EXISTS idx_application_documents_type ON application_documents(document_type);

                -- Trigger pour la mise à jour automatique des timestamps
                CREATE TRIGGER IF NOT EXISTS update_applications_timestamp
                AFTER UPDATE ON applications
                BEGIN
                    UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_application_stages_timestamp
                AFTER UPDATE ON application_stages
                BEGIN
                    UPDATE application_stages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_application_documents_timestamp
                AFTER UPDATE ON application_documents
                BEGIN
                    UPDATE application_documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_application_notes_timestamp
                AFTER UPDATE ON application_notes
                BEGIN
                    UPDATE application_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END;

                INSERT INTO schema_version (version) VALUES (4);
            ",
            down: "
                DROP TRIGGER IF EXISTS update_applications_timestamp;
                DROP TRIGGER IF EXISTS update_application_stages_timestamp;
                DROP TRIGGER IF EXISTS update_application_documents_timestamp;
                DROP TRIGGER IF EXISTS update_application_notes_timestamp;
                
                DROP INDEX IF EXISTS idx_applications_status;
                DROP INDEX IF EXISTS idx_applications_user_job;
                DROP INDEX IF EXISTS idx_application_stages_type;
                DROP INDEX IF EXISTS idx_application_documents_type;
                
                DROP TABLE IF EXISTS application_notes;
                DROP TABLE IF EXISTS application_documents;
                DROP TABLE IF EXISTS application_stages;
                DROP TABLE IF EXISTS applications;
                
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