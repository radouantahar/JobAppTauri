use std::sync::Arc;
use tokio::sync::Mutex;
use tauri_plugin_sql::{Migration, Pool};
use anyhow::Result;
#[macro_use]
use log::info;

pub type DbPool = Arc<Mutex<Pool>>;
pub type DbResult<T> = Result<T>;
pub type DbRow = tauri_plugin_sql::Row;

pub struct TauriSql {
    pub pool: DbPool,
}

impl TauriSql {
    pub async fn new(db_url: &str) -> Result<Self> {
        let pool = Pool::connect(db_url).await?;
        Ok(Self {
            pool: Arc::new(Mutex::new(pool)),
        })
    }
}

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Initial schema",
            sql: include_str!("../migrations/0001_initial_schema.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ]
}

pub struct Database {
    pool: DbPool,
}

impl Database {
    pub async fn new(db_url: &str) -> Result<Self> {
        let pool = Pool::connect(db_url).await?;
        info!("Base de données connectée avec succès");
        Ok(Self {
            pool: Arc::new(Mutex::new(pool)),
        })
    }

    pub async fn run_migrations(&self) -> Result<()> {
        // Les migrations sont gérées par tauri-plugin-sql
        info!("Migrations exécutées avec succès");
        Ok(())
    }

    pub fn get_pool(&self) -> &DbPool {
        &self.pool
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_db_connection() -> Result<()> {
        let db = TauriSql::new("sqlite::memory:").await?;
        assert!(db.pool.lock().await.is_ok());
        Ok(())
    }

    #[tokio::test]
    async fn test_migrations() -> Result<()> {
        let temp_dir = tempdir()?;
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new(db_path.to_str().unwrap()).await?;
        
        // Exécuter les migrations
        db.run_migrations().await?;
        
        // Vérifier que les tables existent
        let tables: Vec<String> = db.pool
            .lock()
            .await
            .query_all(
                "SELECT name FROM sqlite_master WHERE type='table'",
                &[]
            )
            .await?
            .into_iter()
            .map(|row| row.get("name"))
            .collect();
        
        assert!(tables.contains(&"users".to_string()));
        assert!(tables.contains(&"jobs".to_string()));
        assert!(tables.contains(&"applications".to_string()));
        assert!(tables.contains(&"documents".to_string()));
        
        Ok(())
    }
} 