# Gestion de la Base de Données

## Configuration

Le projet utilise `tauri-plugin-sql` pour toutes les opérations de base de données. Cette configuration est définie dans `Cargo.toml` :

```toml
[dependencies]
tauri-plugin-sql = { version = "2.0.0-rc.3", features = ["sqlite"] }
```

## Types de Base

### DbPool
```rust
pub type DbPool = tauri_plugin_sql::Pool;
```

### DbResult
```rust
pub type DbResult<T> = Result<T, tauri_plugin_sql::Error>;
```

## Utilisation

### Exécution de Requêtes

Pour exécuter une requête qui ne retourne pas de résultats (INSERT, UPDATE, DELETE) :
```rust
pool.execute(
    "INSERT INTO table (column) VALUES (?)",
    &[&value],
).await?;
```

Pour exécuter une requête qui retourne des résultats (SELECT) :
```rust
let rows = pool.query(
    "SELECT * FROM table WHERE column = ?",
    &[&value],
).await?;
```

### Récupération des Résultats

Pour récupérer les résultats d'une requête :
```rust
for row in rows {
    let value: String = row.get("column")?;
    // ...
}
```

## Bonnes Pratiques

1. **Ne pas utiliser sqlx** : Le projet n'utilise plus sqlx, toutes les opérations de base de données doivent être faites avec tauri-plugin-sql.

2. **Gestion des Erreurs** : Toujours utiliser le type `DbResult` pour la gestion des erreurs.

3. **Paramètres de Requête** : Toujours utiliser des paramètres nommés pour éviter les injections SQL.

4. **Transactions** : Utiliser les transactions pour les opérations multiples :
```rust
pool.transaction(|tx| {
    // opérations de base de données
}).await?;
```

## Migration

Pour migrer des données ou modifier le schéma, utiliser le système de migrations de tauri-plugin-sql :

```rust
let migrations = vec![
    Migration {
        version: 1,
        description: "create initial tables",
        sql: include_str!("../migrations/0001_initial_schema.sql"),
        kind: MigrationKind::Up,
    },
    // ...
];
```

## Tests

Pour les tests unitaires, utiliser le pool de test fourni par tauri-plugin-sql :

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tauri_plugin_sql::test::TestPool;

    #[tokio::test]
    async fn test_example() {
        let pool = TestPool::new().await;
        // tests...
    }
}
``` 