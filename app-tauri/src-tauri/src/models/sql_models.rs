use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: Uuid,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_type: String,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub description: String,
    pub url: String,
    pub posted_at: DateTime<Utc>,
    pub experience_level: String,
    pub skills: String,
    pub remote: bool,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Application {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub status: String,
    pub applied_date: DateTime<Utc>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub name: String,
    pub content: String,
    pub document_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

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
            "#,
            kind: MigrationKind::Up,
        },
    ]
} 