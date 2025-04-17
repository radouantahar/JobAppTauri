use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::path::Path;
use anyhow::Result;
use tracing::info;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(db_path: &str) -> Result<Self> {
        let connect_options = SqliteConnectOptions::new()
            .filename(db_path)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(connect_options)
            .await?;

        info!("Base de données connectée avec succès");

        Ok(Self { pool })
    }

    pub async fn run_migrations(&self) -> Result<()> {
        sqlx::migrate!("./migrations")
            .run(&self.pool)
            .await?;

        info!("Migrations exécutées avec succès");
        Ok(())
    }

    pub fn get_pool(&self) -> &SqlitePool {
        &self.pool
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_database_connection() -> Result<()> {
        let temp_dir = tempdir()?;
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new(db_path.to_str().unwrap()).await?;
        
        // Vérifier que la connexion est établie
        let _ = sqlx::query("SELECT 1").fetch_one(db.get_pool()).await?;
        
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
        let tables: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        .fetch_all(db.get_pool())
        .await?;
        
        assert!(tables.contains(&"users".to_string()));
        assert!(tables.contains(&"jobs".to_string()));
        assert!(tables.contains(&"applications".to_string()));
        assert!(tables.contains(&"documents".to_string()));
        
        Ok(())
    }
} 