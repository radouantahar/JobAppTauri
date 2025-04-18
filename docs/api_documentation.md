# Documentation des API

## Authentification

### Inscription
```rust
#[tauri::command]
async fn register(
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    pool: State<'_, SqlitePool>,
) -> Result<User, String>
```

**Exemple d'utilisation :**
```typescript
const user = await invoke('register', {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
});
```

### Connexion
```rust
#[tauri::command]
async fn login(
    email: String,
    password: String,
    pool: State<'_, SqlitePool>,
) -> Result<User, String>
```

**Exemple d'utilisation :**
```typescript
const user = await invoke('login', {
  email: 'test@example.com',
  password: 'password123'
});
```

## Gestion des Documents

### Création de Document
```rust
#[tauri::command]
async fn create_document(
    name: String,
    content: String,
    document_type: String,
    pool: State<'_, SqlitePool>,
) -> Result<Document, String>
```

**Exemple d'utilisation :**
```typescript
const document = await invoke('create_document', {
  name: 'Mon CV',
  content: 'Contenu du CV...',
  document_type: 'CV'
});
```

### Recherche de Documents
```rust
#[tauri::command]
async fn find_documents_by_type(
    document_type: String,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Document>, String>
```

**Exemple d'utilisation :**
```typescript
const cvs = await invoke('find_documents_by_type', {
  document_type: 'CV'
});
```

## Gestion des Candidatures

### Création de Candidature
```rust
#[tauri::command]
async fn create_application(
    user_id: Uuid,
    job_id: Uuid,
    status: String,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<Application, String>
```

**Exemple d'utilisation :**
```typescript
const application = await invoke('create_application', {
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  job_id: '123e4567-e89b-12d3-a456-426614174001',
  status: 'EN_COURS',
  notes: 'Entretien prévu le 15/04'
});
```

### Recherche de Candidatures
```rust
#[tauri::command]
async fn find_applications_by_status(
    status: String,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Application>, String>
```

**Exemple d'utilisation :**
```typescript
const interviews = await invoke('find_applications_by_status', {
  status: 'Interview'
});
```

## Gestion des Erreurs

### Format des Erreurs
```rust
#[derive(Debug)]
pub enum AppError {
    Database(String),
    Validation(String),
    NotFound(String),
    Auth(String),
    Internal(String),
}
```

**Exemple d'erreur :**
```json
{
  "error": {
    "code": "Database",
    "message": "Erreur lors de l'exécution de la requête",
    "details": "Erreur SQL: ..."
  }
}
```

## Transactions

### Exemple de Transaction
```rust
#[tauri::command]
async fn create_application_with_documents(
    application: Application,
    documents: Vec<Document>,
    pool: State<'_, SqlitePool>,
) -> Result<Application, String> {
    pool.transaction(|tx| async move {
        // Créer les documents
        for doc in documents {
            doc.create(&tx).await?;
        }
        
        // Créer la candidature
        application.create(&tx).await?;
        
        Ok(application)
    }).await
}
```

## Optimisations

### Mise en Cache
```rust
#[tauri::command]
async fn get_cached_jobs(
    cache_key: String,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Job>, String> {
    // Vérifier le cache
    if let Some(cached_jobs) = cache.get(&cache_key) {
        return Ok(cached_jobs);
    }
    
    // Récupérer depuis la base de données
    let jobs = pool.query_all("SELECT * FROM jobs").await?;
    
    // Mettre en cache
    cache.set(&cache_key, &jobs);
    
    Ok(jobs)
}
```

### Indexation
```rust
#[tauri::command]
async fn create_indexes(
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // Créer les index pour optimiser les requêtes fréquentes
    pool.execute(
        "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)",
        &[],
    ).await?;
    
    pool.execute(
        "CREATE INDEX IF NOT EXISTS idx_jobs_matching_score ON jobs(matching_score)",
        &[],
    ).await?;
    
    Ok(())
}
```

## Migration vers tauri-plugin-sql

### Changements Principaux
1. **Nouvelle Structure de Base de Données**
   - Utilisation de SQLite via tauri-plugin-sql
   - Schémas optimisés pour les performances
   - Index sur les champs fréquemment recherchés

2. **Nouvelles Fonctionnalités**
   - Transactions atomiques
   - Gestion améliorée de la concurrence
   - Meilleure gestion des erreurs

3. **Optimisations de Performance**
   - Index sur les champs de recherche
   - Transactions pour les opérations en masse
   - Requêtes optimisées

### Exemple de Migration
```rust
// Ancien code
let conn = rusqlite::Connection::open("database.db")?;
conn.execute("INSERT INTO users (email) VALUES (?1)", &[&email])?;

// Nouveau code
let pool = SqlitePool::connect("sqlite::memory:").await?;
sqlx::query("INSERT INTO users (email) VALUES (?)")
    .bind(email)
    .execute(&pool)
    .await?;
```

### Bonnes Pratiques
1. **Utilisation des Transactions**
   ```rust
   pool.transaction(|tx| async move {
       // Opérations dans la transaction
       Ok(())
   }).await?;
   ```

2. **Gestion des Erreurs**
   ```rust
   match result {
       Ok(data) => Ok(data),
       Err(e) => Err(format!("Erreur: {}", e)),
   }
   ```

3. **Optimisation des Requêtes**
   ```rust
   // Utiliser des index
   CREATE INDEX idx_users_email ON users(email);
   
   // Utiliser des transactions pour les opérations en masse
   pool.transaction(|tx| async move {
       for item in items {
           // Opérations en masse
       }
       Ok(())
   }).await?;
   ```

4. **Monitoring des Performances**
   ```rust
   // Log des requêtes lentes
   if query_time > SLOW_QUERY_THRESHOLD {
       log::warn!("Requête lente: {}ms", query_time);
   }
   ```

5. **Gestion de la Concurrence**
   ```rust
   // Utiliser des transactions pour éviter les conflits
   pool.transaction(|tx| async move {
       // Opérations concurrentes
       Ok(())
   }).await?;
   ```

6. **Backup et Restauration**
   ```rust
   // Backup automatique
   async fn backup_database(pool: &SqlitePool) -> Result<(), String> {
       // Code de backup
       Ok(())
   }
   ``` 