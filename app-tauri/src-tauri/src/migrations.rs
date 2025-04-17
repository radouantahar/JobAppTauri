use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Initial schema",
            sql: r#"
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                );

                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
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
                    source TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                );

                CREATE TABLE IF NOT EXISTS applications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    applied_date TIMESTAMP NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                );

                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    content TEXT NOT NULL,
                    document_type TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                );

                -- Indexes pour optimiser les performances
                CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
                CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
                CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
                CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
                CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
                CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Add user preferences table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS user_preferences (
                    user_id TEXT PRIMARY KEY,
                    search_preferences TEXT,
                    notification_preferences TEXT,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            "#,
            kind: MigrationKind::Up,
        },
    ]
} 