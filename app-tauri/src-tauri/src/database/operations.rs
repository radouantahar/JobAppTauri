use tauri_plugin_sql::{SqlitePool, Row};
use crate::models::{User, Job, JobStats, Document, DocumentTemplate, SearchPreferences, JobApplication};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::error::AppError;
use std::collections::VecDeque;
use std::time::Duration;
use std::collections::HashMap;
use std::time::Instant;

const MAX_CONNECTIONS: usize = 10;
const CONNECTION_TIMEOUT: Duration = Duration::from_secs(30);
const CACHE_TTL: Duration = Duration::from_secs(300); // 5 minutes

struct CacheEntry<T> {
    value: T,
    timestamp: Instant,
}

pub struct DatabaseOperations {
    pool: SqlitePool,
    job_cache: Arc<Mutex<HashMap<String, CacheEntry<Vec<Job>>>>>,
}

impl DatabaseOperations {
    pub async fn new(path: &str) -> Result<Self, AppError> {
        let pool = SqlitePool::new(path).await?;
        
        Ok(Self {
            pool,
            job_cache: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub async fn init(&self) -> Result<(), AppError> {
        // Création des tables avec optimisations
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME NOT NULL
            )",
            &[],
        ).await?;

        // Création de l'index sur l'email
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            &[],
        ).await?;

        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                description TEXT,
                salary_range TEXT,
                matching_score REAL,
                status TEXT NOT NULL,
                source TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )",
            &[],
        ).await?;

        // Création des index pour les requêtes fréquentes
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)",
            &[],
        ).await?;
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_matching_score ON jobs(matching_score)",
            &[],
        ).await?;
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company)",
            &[],
        ).await?;
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)",
            &[],
        ).await?;

        // Table des documents avec index
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                file_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )",
            &[],
        ).await?;

        // Index pour les documents
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)",
            &[],
        ).await?;

        // Table des modèles de documents avec index
        self.pool.execute(
            "CREATE TABLE IF NOT EXISTS document_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                template_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            &[],
        ).await?;

        // Index pour les templates
        self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_templates_type ON document_templates(template_type)",
            &[],
        ).await?;

        Ok(())
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<User, AppError> {
        let row = self.pool.query_one(
            "SELECT * FROM users WHERE email = ?",
            &[&email],
        ).await?;

        Ok(User::from(row))
    }

    pub async fn create_user(&self, email: &str, password: &str) -> Result<User, AppError> {
        let now = chrono::Utc::now();
        self.pool.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            &[&email, &password, &now],
        ).await?;

        let row = self.pool.query_one(
            "SELECT * FROM users WHERE email = ?",
            &[&email],
        ).await?;

        Ok(User::from(row))
    }

    pub fn create_job(&self, job: Job) -> Result<Job> {
        let conn = self.pool.get_connection()?;
        conn.execute(
            "INSERT INTO jobs (title, company, location, description, salary_range, matching_score, status, source) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            &[
                &job.title,
                &job.company,
                &job.location,
                &job.description,
                &job.salary_range,
                &job.matching_score,
                &job.status,
                &job.source,
            ],
        )?;
        let id = conn.last_insert_rowid();
        Ok(Job {
            id,
            ..job
        })
    }

    pub fn update_job_status(&self, job_id: i64, status: &str) -> Result<bool> {
        let conn = self.pool.get_connection()?;
        let rows_affected = conn.execute(
            "UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            &[status, &job_id],
        )?;
        Ok(rows_affected > 0)
    }

    pub fn get_user_documents(&self, user_id: i64) -> Result<Vec<Document>> {
        let conn = self.pool.get_connection()?;
        let mut stmt = conn.prepare("SELECT * FROM documents WHERE user_id = ?")?;
        let documents = stmt
            .query_map([user_id], |row| {
                Ok(Document {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    file_path: row.get(3)?,
                    document_type: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(documents)
    }

    pub fn get_template_by_type(&self, template_type: &str) -> Result<Option<DocumentTemplate>> {
        let conn = self.pool.get_connection()?;
        let mut stmt = conn.prepare("SELECT * FROM document_templates WHERE template_type = ?")?;
        let template = stmt
            .query_row([template_type], |row| {
                Ok(DocumentTemplate {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    template_type: row.get(2)?,
                    content: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .ok();
        Ok(template)
    }

    pub async fn get_jobs(&self) -> Result<Vec<Job>, AppError> {
        // Vérifier le cache
        let cache_key = "all_jobs".to_string();
        let mut cache = self.job_cache.lock().await;
        
        if let Some(entry) = cache.get(&cache_key) {
            if entry.timestamp.elapsed() < CACHE_TTL {
                return Ok(entry.value.clone());
            }
        }

        let conn = self.pool.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, title, company, location, description, salary_range, matching_score, status, source 
             FROM jobs 
             ORDER BY matching_score DESC, created_at DESC"
        )?;
        
        let jobs = stmt
            .query_map([], |row| {
                Ok(Job {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    company: row.get(2)?,
                    location: row.get(3)?,
                    description: row.get(4)?,
                    salary_range: row.get(5)?,
                    matching_score: row.get(6)?,
                    status: row.get(7)?,
                    source: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        // Mettre à jour le cache
        cache.insert(
            cache_key,
            CacheEntry {
                value: jobs.clone(),
                timestamp: Instant::now(),
            },
        );

        Ok(jobs)
    }

    pub async fn get_job_stats(&self) -> Result<JobStats, AppError> {
        let conn = self.pool.get_connection()?;
        
        // Requête optimisée pour les statistiques
        let mut stmt = conn.prepare(
            "SELECT 
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_jobs,
                SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied_jobs,
                SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview_jobs,
                SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer_jobs,
                AVG(matching_score) as avg_score
             FROM jobs"
        )?;

        let stats = stmt.query_row([], |row| {
            Ok(JobStats {
                total_jobs: row.get(0)?,
                status_distribution: vec![
                    ("new".to_string(), row.get(1)?),
                    ("applied".to_string(), row.get(2)?),
                    ("interview".to_string(), row.get(3)?),
                    ("offer".to_string(), row.get(4)?),
                ],
                source_distribution: vec![], // À implémenter si nécessaire
            })
        })?;

        Ok(stats)
    }

    pub async fn create_document(
        &self,
        user_id: i64,
        title: &str,
        content: &str,
        document_type: &str,
    ) -> Result<Document, AppError> {
        let conn = self.pool.get_connection()?;
        conn.execute(
            "INSERT INTO documents (user_id, title, content, document_type) VALUES (?, ?, ?, ?)",
            &[&user_id, &title, &content, &document_type],
        )?;
        let id = conn.last_insert_rowid();
        Ok(Document {
            id,
            user_id,
            title: title.to_string(),
            content: content.to_string(),
            document_type: document_type.to_string(),
        })
    }

    pub async fn get_document_templates(&self) -> Result<Vec<DocumentTemplate>, AppError> {
        let conn = self.pool.get_connection()?;
        let mut stmt = conn.prepare("SELECT id, template_type, content FROM document_templates")?;
        let templates = stmt
            .query_map([], |row| {
                Ok(DocumentTemplate {
                    id: row.get(0)?,
                    template_type: row.get(1)?,
                    content: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(templates)
    }

    async fn get_cached_jobs(&self, cache_key: &str) -> Option<Vec<Job>> {
        let cache = self.job_cache.lock().await;
        if let Some(entry) = cache.get(cache_key) {
            if entry.timestamp.elapsed() < CACHE_TTL {
                return Some(entry.value.clone());
            }
        }
        None
    }

    async fn cache_jobs(&self, cache_key: String, jobs: Vec<Job>) {
        let mut cache = self.job_cache.lock().await;
        cache.insert(cache_key, CacheEntry {
            value: jobs,
            timestamp: Instant::now(),
        });
    }

    pub async fn search_jobs(&self, keywords: Option<&str>, location: Option<&str>) -> Result<Vec<Job>, AppError> {
        let cache_key = format!("search:{}:{}", 
            keywords.unwrap_or(""), 
            location.unwrap_or("")
        );

        // Vérifier le cache
        if let Some(cached_jobs) = self.get_cached_jobs(&cache_key).await {
            return Ok(cached_jobs);
        }

        let conn = self.pool.get_connection()?;
        let mut query = "SELECT id, title, company, location, description, matching_score FROM jobs WHERE 1=1".to_string();
        let mut params = Vec::new();

        if let Some(kw) = keywords {
            query.push_str(" AND (title LIKE ? OR company LIKE ? OR description LIKE ?)");
            let search_term = format!("%{}%", kw);
            params.push(search_term.clone());
            params.push(search_term.clone());
            params.push(search_term);
        }

        if let Some(loc) = location {
            query.push_str(" AND location LIKE ?");
            params.push(format!("%{}%", loc));
        }

        query.push_str(" ORDER BY matching_score DESC LIMIT 100");

        let mut stmt = conn.prepare(&query)?;
        let jobs = stmt
            .query_map(params_from_iter(params.iter()), |row| {
                Ok(Job {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    company: row.get(2)?,
                    location: row.get(3)?,
                    description: row.get(4)?,
                    matching_score: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        // Mettre en cache les résultats
        self.cache_jobs(cache_key, jobs.clone()).await;
        
        Ok(jobs)
    }
} 