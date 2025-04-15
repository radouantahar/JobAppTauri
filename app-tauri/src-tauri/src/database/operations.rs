use rusqlite::{Connection, Result, params};
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
    pool: Arc<Mutex<VecDeque<Connection>>>,
    path: String,
    job_cache: Arc<Mutex<HashMap<String, CacheEntry<Vec<Job>>>>>,
}

impl DatabaseOperations {
    pub fn new(path: &str) -> Result<Self> {
        let mut pool = VecDeque::with_capacity(MAX_CONNECTIONS);
        
        // Créer les connexions initiales
        for _ in 0..MAX_CONNECTIONS {
            let conn = Connection::open(path)?;
            pool.push_back(conn);
        }

        Ok(Self {
            pool: Arc::new(Mutex::new(pool)),
            path: path.to_string(),
            job_cache: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    async fn get_connection(&self) -> Result<Connection, AppError> {
        let mut pool = self.pool.lock().await;
        
        // Attendre jusqu'à ce qu'une connexion soit disponible
        let start_time = std::time::Instant::now();
        while pool.is_empty() {
            if start_time.elapsed() > CONNECTION_TIMEOUT {
                return Err(AppError::Internal("Timeout waiting for database connection".to_string()));
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        // Récupérer une connexion du pool
        let conn = pool.pop_front().unwrap();
        Ok(conn)
    }

    async fn return_connection(&self, conn: Connection) {
        let mut pool = self.pool.lock().await;
        pool.push_back(conn);
    }

    pub async fn init(&self) -> Result<()> {
        let conn = self.get_connection().await?;
        
        // Création des tables avec optimisations
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME NOT NULL
            )",
            [],
        )?;

        // Création de l'index sur l'email
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            [],
        )?;

        conn.execute(
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
            [],
        )?;

        // Création des index pour les requêtes fréquentes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_matching_score ON jobs(matching_score)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)",
            [],
        )?;

        // Table des documents avec index
        conn.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                file_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )",
            [],
        )?;

        // Index pour les documents
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)",
            [],
        )?;

        // Table des modèles de documents avec index
        conn.execute(
            "CREATE TABLE IF NOT EXISTS document_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                template_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Index pour les templates
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_templates_type ON document_templates(template_type)",
            [],
        )?;

        self.return_connection(conn).await;
        Ok(())
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<User, AppError> {
        let conn = self.get_connection().await?;
        let mut stmt = conn.prepare("SELECT id, email, password_hash FROM users WHERE email = ?")?;
        let user = stmt.query_row(params![email], |row| {
            Ok(User {
                id: row.get(0)?,
                email: row.get(1)?,
                password_hash: row.get(2)?,
            })
        })?;
        self.return_connection(conn).await;
        Ok(user)
    }

    pub async fn create_user(&self, email: &str, password: &str) -> Result<User, AppError> {
        let conn = self.get_connection().await?;
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            params![email, password],
        )?;
        let id = conn.last_insert_rowid();
        Ok(User {
            id,
            email: email.to_string(),
            password_hash: password.to_string(),
        })
    }

    pub fn create_job(&self, job: Job) -> Result<Job> {
        let conn = self.get_connection().await?;
        conn.execute(
            "INSERT INTO jobs (title, company, location, description, salary_range, matching_score, status, source) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                job.title,
                job.company,
                job.location,
                job.description,
                job.salary_range,
                job.matching_score,
                job.status,
                job.source,
            ],
        )?;
        let id = conn.last_insert_rowid();
        Ok(Job {
            id,
            ..job
        })
    }

    pub fn update_job_status(&self, job_id: i64, status: &str) -> Result<bool> {
        let conn = self.get_connection().await?;
        let rows_affected = conn.execute(
            "UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            params![status, job_id],
        )?;
        Ok(rows_affected > 0)
    }

    pub fn get_user_documents(&self, user_id: i64) -> Result<Vec<Document>> {
        let conn = self.get_connection().await?;
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
        let conn = self.get_connection().await?;
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

        let conn = self.get_connection().await?;
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

        self.return_connection(conn).await;
        Ok(jobs)
    }

    pub async fn get_job_stats(&self) -> Result<JobStats, AppError> {
        let conn = self.get_connection().await?;
        
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

        self.return_connection(conn).await;
        Ok(stats)
    }

    pub async fn create_document(
        &self,
        user_id: i64,
        title: &str,
        content: &str,
        document_type: &str,
    ) -> Result<Document, AppError> {
        let conn = self.get_connection().await?;
        conn.execute(
            "INSERT INTO documents (user_id, title, content, document_type) VALUES (?, ?, ?, ?)",
            params![user_id, title, content, document_type],
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
        let conn = self.get_connection().await?;
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

        let conn = self.get_connection().await?;
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

        self.return_connection(conn).await;
        
        // Mettre en cache les résultats
        self.cache_jobs(cache_key, jobs.clone()).await;
        
        Ok(jobs)
    }
} 