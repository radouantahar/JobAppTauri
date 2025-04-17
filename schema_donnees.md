# Schéma de Données - Application d'Automatisation de Recherche d'Emploi

## Vue d'Ensemble

Le schéma de données est conçu pour supporter une application desktop locale avec Tauri, en utilisant SQLite comme base de données principale et NocoDB pour l'interface Kanban. Le schéma est optimisé pour la performance et la maintenabilité.

## Tables Principales

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### User Profiles
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    name TEXT,
    phone TEXT,
    location TEXT,
    primary_home TEXT,
    secondary_home TEXT,
    skills TEXT[],
    experience TEXT,
    education TEXT,
    cv_path TEXT,
    cv_last_updated TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Jobs
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL,
    posted_at TIMESTAMP NOT NULL,
    experience_level TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT,
    salary_period TEXT,
    description TEXT NOT NULL,
    url TEXT,
    remote BOOLEAN DEFAULT FALSE,
    skills TEXT[],
    source TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Applications
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),
    status TEXT NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    notes TEXT,
    cv_path TEXT,
    cover_letter_path TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Application Stages
```sql
CREATE TABLE application_stages (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES applications(id),
    stage_type TEXT NOT NULL,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    outcome TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Application Notes
```sql
CREATE TABLE application_notes (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES applications(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Application Documents
```sql
CREATE TABLE application_documents (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES applications(id),
    document_type TEXT NOT NULL,
    file_path TEXT,
    content TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## Relations

- Un utilisateur a un profil (`users` -> `user_profiles`)
- Un utilisateur peut avoir plusieurs offres (`users` -> `jobs`)
- Une offre peut avoir plusieurs candidatures (`jobs` -> `applications`)
- Une candidature peut avoir plusieurs étapes (`applications` -> `application_stages`)
- Une candidature peut avoir plusieurs notes (`applications` -> `application_notes`)
- Une candidature peut avoir plusieurs documents (`applications` -> `application_documents`)
- Un utilisateur peut avoir plusieurs documents (`users` -> `documents`)

## Index

```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_application_stages_application_id ON application_stages(application_id);
CREATE INDEX idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
```

## Contraintes

- Clés étrangères pour maintenir l'intégrité des données
- Valeurs uniques pour les emails des utilisateurs
- Valeurs non nulles pour les champs obligatoires
- Types de données appropriés pour chaque champ

## Index et Optimisations

### Index Principaux
```sql
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_job_matches_score ON job_matches(score);
CREATE INDEX idx_transport_times_duration ON transport_times(duration);
```

### Index Composés
```sql
CREATE INDEX idx_jobs_source_id ON jobs(source, source_id);
CREATE INDEX idx_applications_user_job ON applications(user_id, job_id);
CREATE INDEX idx_locations_user ON locations(user_id, is_primary);
```

## Vues Utilitaires

### Vue des Offres Actives
```sql
CREATE VIEW active_jobs AS
SELECT j.*, COUNT(a.id) as application_count
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.expires_at > CURRENT_TIMESTAMP
GROUP BY j.id;
```

### Vue des Correspondances Récentes
```sql
CREATE VIEW recent_matches AS
SELECT j.*, m.score, m.match_details
FROM jobs j
JOIN job_matches m ON j.id = m.job_id
WHERE m.created_at > datetime('now', '-7 days')
ORDER BY m.score DESC;
```

## Triggers

### Mise à jour automatique des timestamps
```sql
CREATE TRIGGER update_jobs_timestamp
AFTER UPDATE ON jobs
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### Gestion des doublons
```sql
CREATE TRIGGER prevent_duplicate_jobs
BEFORE INSERT ON jobs
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM jobs 
            WHERE source = NEW.source AND source_id = NEW.source_id
        ) THEN
            RAISE(ABORT, 'Duplicate job entry')
    END;
END;
```

## Intégration avec NocoDB

### Tables Synchronisées
- `jobs` → Table principale des offres
- `applications` → Suivi des candidatures
- `profiles` → Profils utilisateurs
- `locations` → Gestion des adresses

### Vues NocoDB
- Vue Kanban des candidatures
- Vue calendrier des entretiens
- Vue statistiques des applications
- Vue analyse des correspondances

## Sécurité des Données

### Chiffrement
- Mots de passe hachés avec bcrypt
- Données sensibles chiffrées au repos
- Clés de chiffrement stockées sécuritairement

### Audit
- Journalisation des accès
- Historique des modifications
- Traçabilité des actions utilisateur

## Maintenance

### Nettoyage Automatique
```sql
-- Suppression des offres expirées
CREATE TRIGGER cleanup_expired_jobs
AFTER INSERT ON jobs
BEGIN
    DELETE FROM jobs WHERE expires_at < CURRENT_TIMESTAMP;
END;
```

### Optimisation
- VACUUM régulier
- ANALYZE des statistiques
- Réindexation périodique

## Implémentation avec sqlx

### Modèles Rust
```rust
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub preferences: serde_json::Value,
    pub settings: serde_json::Value,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Profile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub full_name: Option<String>,
    pub current_position: Option<String>,
    pub summary: Option<String>,
    pub skills: serde_json::Value,
    pub experiences: serde_json::Value,
    pub education: serde_json::Value,
    pub languages: serde_json::Value,
}
```

### Requêtes SQLx
```rust
// Exemple de requête avec sqlx
async fn get_user_by_id(
    pool: &sqlx::Pool<sqlx::Sqlite>,
    user_id: Uuid,
) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users
        WHERE id = ?
        "#,
        user_id
    )
    .fetch_one(pool)
    .await
}

// Exemple de transaction
async fn create_user_with_profile(
    pool: &sqlx::Pool<sqlx::Sqlite>,
    user: User,
    profile: Profile,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    
    sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, password_hash, created_at, preferences, settings)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
        user.id,
        user.username,
        user.email,
        user.password_hash,
        user.created_at,
        user.preferences,
        user.settings
    )
    .execute(&mut tx)
    .await?;

    sqlx::query!(
        r#"
        INSERT INTO profiles (id, user_id, full_name, current_position, summary, skills, experiences, education, languages)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        profile.id,
        profile.user_id,
        profile.full_name,
        profile.current_position,
        profile.summary,
        profile.skills,
        profile.experiences,
        profile.education,
        profile.languages
    )
    .execute(&mut tx)
    .await?;

    tx.commit().await
}
```

### Migrations
Les migrations sont gérées avec sqlx-cli :
```bash
# Créer une nouvelle migration
sqlx migrate add <nom_migration>

# Appliquer les migrations
sqlx migrate run

# Vérifier l'état des migrations
sqlx migrate info
```
