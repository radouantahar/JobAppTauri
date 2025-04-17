# Guide de Migration vers tauri-plugin-sql

## Vue d'Ensemble

Ce guide documente la migration de l'application vers tauri-plugin-sql, incluant les changements de structure, les nouvelles fonctionnalités et les bonnes pratiques.

## Changements Techniques

### 1. Structure de la Base de Données

#### Ancienne Structure
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL
);
```

#### Nouvelle Structure
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

### 2. Modèles de Données

#### Ancien Modèle
```rust
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
}
```

#### Nouveau Modèle
```rust
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
```

### 3. Commandes Tauri

#### Ancienne Commande
```rust
#[tauri::command]
fn create_user(email: String, password: String) -> Result<(), String> {
    let conn = Connection::open("database.db")?;
    conn.execute(
        "INSERT INTO users (email, password_hash) VALUES (?1, ?2)",
        &[&email, &hash_password(password)],
    )?;
    Ok(())
}
```

#### Nouvelle Commande
```rust
#[tauri::command]
async fn create_user(
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    pool: State<'_, SqlitePool>,
) -> Result<User, String> {
    let user = User {
        id: Uuid::new_v4(),
        email,
        password_hash: hash_password(password),
        first_name,
        last_name,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    user.create(&pool).await?;
    Ok(user)
}
```

## Étapes de Migration

### 1. Préparation
- Sauvegarder la base de données existante
- Documenter les schémas actuels
- Planifier les tests de migration

### 2. Migration des Données
```sql
-- Script de migration
BEGIN TRANSACTION;

-- Créer les nouvelles tables
CREATE TABLE new_users (...);

-- Migrer les données
INSERT INTO new_users (id, email, password_hash, ...)
SELECT id, email, password_hash, ... FROM users;

-- Renommer les tables
DROP TABLE users;
ALTER TABLE new_users RENAME TO users;

COMMIT;
```

### 3. Mise à Jour du Code
- Adapter les modèles de données
- Mettre à jour les commandes Tauri
- Implémenter les nouvelles fonctionnalités

### 4. Tests et Validation
- Vérifier l'intégrité des données
- Tester les performances
- Valider les nouvelles fonctionnalités

## Bonnes Pratiques

### 1. Gestion des Transactions
```rust
pool.transaction(|tx| async move {
    // Opérations atomiques
    Ok(())
}).await?;
```

### 2. Optimisation des Requêtes
```rust
// Utiliser des index
CREATE INDEX idx_field ON table(field);

// Optimiser les jointures
SELECT * FROM table1
JOIN table2 ON table1.id = table2.table1_id
WHERE table1.field = ?;
```

### 3. Gestion des Erreurs
```rust
match result {
    Ok(data) => Ok(data),
    Err(e) => {
        error!("Erreur: {}", e);
        Err("Erreur lors de l'opération".into())
    }
}
```

## Résolution des Problèmes Courants

### 1. Problèmes de Concurrence
- Utiliser des transactions
- Implémenter des verrous optimistes
- Gérer les conflits de mise à jour

### 2. Problèmes de Performance
- Ajouter des index appropriés
- Optimiser les requêtes fréquentes
- Utiliser le chargement paresseux

### 3. Problèmes de Migration
- Tester la migration sur un environnement de test
- Prévoir un plan de rollback
- Documenter les étapes de migration

## Ressources Additionnelles

- [Documentation tauri-plugin-sql](https://github.com/tauri-apps/tauri-plugin-sql)
- [Guide SQLite](https://www.sqlite.org/docs.html)
- [Documentation Rust](https://doc.rust-lang.org/book/) 