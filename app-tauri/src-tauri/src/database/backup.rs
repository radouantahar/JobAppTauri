use std::path::Path;
use std::fs;
use chrono::Utc;
use tauri_plugin_sql::SqlitePool;
use crate::error::AppError;
use std::time::Duration;
use tokio::time::sleep;

const BACKUP_DIR: &str = "backups";
const MAX_BACKUPS: usize = 7; // Garder une semaine de backups
const BACKUP_INTERVAL: Duration = Duration::from_secs(24 * 60 * 60); // 24 heures

pub struct DatabaseBackup {
    pool: SqlitePool,
    backup_dir: String,
}

impl DatabaseBackup {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            backup_dir: BACKUP_DIR.to_string(),
        }
    }

    /// Initialise le système de backup
    pub async fn init(&self) -> Result<(), AppError> {
        // Créer le dossier de backup s'il n'existe pas
        if !Path::new(&self.backup_dir).exists() {
            fs::create_dir(&self.backup_dir)?;
        }

        // Démarrer la boucle de backup
        self.start_backup_loop().await
    }

    /// Crée un backup de la base de données
    pub async fn create_backup(&self) -> Result<String, AppError> {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_path = format!("{}/backup_{}.db", self.backup_dir, timestamp);

        // Créer une copie de la base de données
        sqlx::query("VACUUM INTO ?")
            .bind(&backup_path)
            .execute(&self.pool)
            .await?;

        // Nettoyer les vieux backups
        self.cleanup_old_backups().await?;

        Ok(backup_path)
    }

    /// Nettoie les vieux backups
    async fn cleanup_old_backups(&self) -> Result<(), AppError> {
        let mut backups: Vec<_> = fs::read_dir(&self.backup_dir)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                entry.path().extension().map_or(false, |ext| ext == "db")
            })
            .collect();

        // Trier par date de modification (le plus récent en premier)
        backups.sort_by(|a, b| {
            b.metadata()
                .unwrap()
                .modified()
                .unwrap()
                .cmp(&a.metadata().unwrap().modified().unwrap())
        });

        // Supprimer les backups les plus anciens
        for backup in backups.iter().skip(MAX_BACKUPS) {
            fs::remove_file(backup.path())?;
        }

        Ok(())
    }

    /// Démarre la boucle de backup
    async fn start_backup_loop(&self) -> Result<(), AppError> {
        loop {
            // Attendre l'intervalle de backup
            sleep(BACKUP_INTERVAL).await;

            // Créer un nouveau backup
            if let Err(e) = self.create_backup().await {
                eprintln!("Erreur lors de la création du backup: {}", e);
            }
        }
    }

    /// Restaure un backup
    pub async fn restore_backup(&self, backup_path: &str) -> Result<(), AppError> {
        // Vérifier que le fichier de backup existe
        if !Path::new(backup_path).exists() {
            return Err(AppError::BackupError("Le fichier de backup n'existe pas".to_string()));
        }

        // Fermer la connexion actuelle
        self.pool.close().await;

        // Copier le backup vers la base de données principale
        fs::copy(backup_path, "app.db")?;

        Ok(())
    }
} 