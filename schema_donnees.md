# Schéma de Données - Application d'Automatisation de Recherche d'Emploi

## Vue d'Ensemble

Le schéma de données est conçu pour supporter une application desktop locale avec Tauri, en utilisant SQLite comme base de données principale et NocoDB pour l'interface Kanban. Le schéma est optimisé pour la performance et la maintenabilité.

## Tables Principales

### 1. Tables de Base

#### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences JSON,
    settings JSON
);
```

#### profiles
```sql
CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT,
    current_position TEXT,
    summary TEXT,
    skills JSON,
    experiences JSON,
    education JSON,
    languages JSON,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### jobs
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    url TEXT,
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(source, source_id)
);
```

### 2. Tables de Gestion

#### applications
```sql
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    applied_at TIMESTAMP,
    response_received BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

#### documents
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. Tables de Configuration

#### search_preferences
```sql
CREATE TABLE search_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keywords JSON,
    locations JSON,
    salary_range JSON,
    job_types JSON,
    experience_levels JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### notification_settings
```sql
CREATE TABLE notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    desktop_notifications BOOLEAN DEFAULT TRUE,
    notification_frequency TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. Tables d'Analyse

#### job_matches
```sql
CREATE TABLE job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    score FLOAT NOT NULL,
    match_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

#### feedback_analysis
```sql
CREATE TABLE feedback_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    feedback_type TEXT NOT NULL,
    feedback_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

### 5. Tables de Géolocalisation

#### locations
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    is_primary BOOLEAN DEFAULT FALSE,
    transport_preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### transport_times
```sql
CREATE TABLE transport_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    duration INTEGER,
    distance FLOAT,
    route_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

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
