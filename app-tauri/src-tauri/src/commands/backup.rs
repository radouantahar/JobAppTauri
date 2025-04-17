use crate::database::backup::DatabaseBackup;
use tauri::State;
use tauri_plugin_sql::SqlitePool;
use crate::error::AppError;

#[tauri::command]
pub async fn create_backup(pool: State<'_, SqlitePool>) -> Result<String, String> {
    let backup = DatabaseBackup::new(pool.inner().clone());
    backup.create_backup()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(
    pool: State<'_, SqlitePool>,
    backup_path: String,
) -> Result<(), String> {
    let backup = DatabaseBackup::new(pool.inner().clone());
    backup.restore_backup(&backup_path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_backups() -> Result<Vec<String>, String> {
    let backup_dir = "backups";
    let mut backups = Vec::new();

    if let Ok(entries) = std::fs::read_dir(backup_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(path) = entry.path().to_str() {
                    backups.push(path.to_string());
                }
            }
        }
    }

    Ok(backups)
} 