use tauri_plugin_sql::TauriSql;
use chrono::Utc;
use uuid::Uuid;

async fn setup_test_db() -> Result<TauriSql, String> {
    let db = TauriSql::new("sqlite:test.db")?;
    let conn = db.get("sqlite:test.db")?;

    // Créer les tables nécessaires
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL,
            name TEXT NOT NULL,
            applied_at TIMESTAMP NOT NULL
        )
        "#,
        &[],
    )?;

    Ok(db)
}

#[tokio::test]
async fn test_migration_table_creation() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    // Vérifier que la table migrations existe
    let mut rows = conn.query(
        r#"
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='migrations'
        "#,
        &[],
    )?;

    let table_exists = rows.next()?.is_some();
    assert!(table_exists, "La table migrations devrait exister");

    Ok(())
}

#[tokio::test]
async fn test_migration_record() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let version = "1.0.0";
    let name = "initial_schema";
    let now = Utc::now();

    // Insérer une migration
    conn.execute(
        r#"
        INSERT INTO migrations (version, name, applied_at)
        VALUES (?, ?, ?)
        "#,
        &[version, name, &now],
    )?;

    // Vérifier l'insertion
    let mut rows = conn.query(
        "SELECT version, name FROM migrations WHERE version = ?",
        &[version],
    )?;

    let migration = if let Some(row) = rows.next()? {
        (
            row.get::<String>("version")?,
            row.get::<String>("name")?,
        )
    } else {
        return Err("Migration not found".to_string());
    };

    assert_eq!(migration.0, version);
    assert_eq!(migration.1, name);

    Ok(())
}

#[tokio::test]
async fn test_multiple_migrations() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let now = Utc::now();

    // Insérer plusieurs migrations
    for i in 1..=3 {
        conn.execute(
            r#"
            INSERT INTO migrations (version, name, applied_at)
            VALUES (?, ?, ?)
            "#,
            &[
                &format!("1.0.{}", i),
                &format!("migration_{}", i),
                &now,
            ],
        )?;
    }

    // Vérifier le nombre de migrations
    let mut rows = conn.query("SELECT COUNT(*) as count FROM migrations", &[])?;

    if let Some(row) = rows.next()? {
        let count: i64 = row.get("count")?;
        assert_eq!(count, 3);
    }

    Ok(())
}

#[tokio::test]
async fn test_migration_order() -> Result<(), String> {
    let db = setup_test_db().await?;
    let conn = db.get("sqlite:test.db")?;

    let now = Utc::now();

    // Insérer des migrations dans un ordre aléatoire
    let versions = vec!["1.0.2", "1.0.1", "1.0.3"];
    for version in versions {
        conn.execute(
            r#"
            INSERT INTO migrations (version, name, applied_at)
            VALUES (?, ?, ?)
            "#,
            &[version, &format!("migration_{}", version), &now],
        )?;
    }

    // Vérifier l'ordre des migrations
    let mut rows = conn.query(
        "SELECT version FROM migrations ORDER BY version",
        &[],
    )?;

    let mut ordered_versions = Vec::new();
    while let Some(row) = rows.next()? {
        ordered_versions.push(row.get::<String>("version")?);
    }

    assert_eq!(ordered_versions, vec!["1.0.1", "1.0.2", "1.0.3"]);

    Ok(())
} 