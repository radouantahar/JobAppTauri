# Schéma de Données - Application d'Automatisation de Recherche d'Emploi

Ce document détaille la structure de la base de données SQLite qui sera utilisée pour stocker toutes les données de l'application.

## Vue d'ensemble

La base de données est conçue pour stocker les informations suivantes :
- Profil de l'utilisateur et ses préférences
- Offres d'emploi scrapées
- Informations sur les entreprises
- Données de transport
- Suivi des candidatures
- Données d'analyse et de scoring

## Schéma Entité-Relation

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ user_profile  │       │     jobs      │       │   companies   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ name          │       │ title         │       │ name          │
│ location      │       │ company_id    │───────│ description   │
│ cv_path       │       │ description   │       │ website       │
│ preferences   │       │ location      │       │ industry      │
└───────────────┘       │ job_type      │       └───────────────┘
        │               │ salary_min    │
        │               │ salary_max    │
        │               │ url           │
        │               │ date_posted   │
        │               │ source        │
        │               │ raw_data      │
        │               │ matching_score│
        │               └───────────────┘
        │                      │
        │                      │
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  user_skills  │       │ applications  │       │ transport_data│
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ user_id       │───────│ job_id        │───────│ job_id        │
│ skill_name    │       │ user_id       │       │ travel_time   │
│ skill_level   │       │ status        │       │ travel_mode   │
│ skill_type    │       │ applied_date  │       │ distance      │
└───────────────┘       │ cv_path       │       │ route_details │
                        │ cover_letter  │       └───────────────┘
                        │ notes         │
                        └───────────────┘
```

## Définition des Tables

### Table: `user_profile`

Stocke les informations sur l'utilisateur et ses préférences de recherche d'emploi.

```sql
CREATE TABLE user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT NOT NULL,
    cv_path TEXT NOT NULL,
    min_salary INTEGER DEFAULT 50000,
    max_travel_time INTEGER DEFAULT 60,  -- en minutes
    preferred_job_types TEXT,  -- stocké en JSON (fulltime, parttime, etc.)
    preferred_locations TEXT,  -- stocké en JSON
    mobility_radius INTEGER DEFAULT 50,  -- en km
    preferences TEXT,  -- autres préférences en JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `user_skills`

Stocke les compétences extraites du CV de l'utilisateur.

```sql
CREATE TABLE user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_name TEXT NOT NULL,
    skill_level TEXT,  -- débutant, intermédiaire, expert
    skill_type TEXT,   -- technique, soft skill, langue, etc.
    is_highlighted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    UNIQUE (user_id, skill_name)
);
```

### Table: `user_experiences`

Stocke les expériences professionnelles extraites du CV de l'utilisateur.

```sql
CREATE TABLE user_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    location TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
```

### Table: `user_education`

Stocke les formations extraites du CV de l'utilisateur.

```sql
CREATE TABLE user_education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
```

### Table: `companies`

Stocke les informations sur les entreprises qui publient des offres d'emploi.

```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    industry TEXT,
    size TEXT,  -- petite, moyenne, grande
    linkedin_url TEXT,
    logo_path TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, website)
);
```

### Table: `jobs`

Stocke les offres d'emploi scrapées.

```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company_id INTEGER,
    description TEXT,
    location TEXT,
    job_type TEXT,  -- fulltime, parttime, contract, etc.
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'EUR',
    salary_period TEXT DEFAULT 'yearly',  -- yearly, monthly, hourly
    url TEXT NOT NULL,
    date_posted DATE,
    date_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL,  -- linkedin, indeed, glassdoor, etc.
    raw_data TEXT,  -- données brutes en JSON
    matching_score REAL,
    is_remote BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'new',  -- new, reviewed, applied, rejected, etc.
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    UNIQUE (url, source)
);
```

### Table: `job_skills`

Stocke les compétences requises pour chaque offre d'emploi.

```sql
CREATE TABLE job_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    skill_name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE (job_id, skill_name)
);
```

### Table: `transport_data`

Stocke les informations de transport entre le domicile de l'utilisateur et le lieu de l'offre.

```sql
CREATE TABLE transport_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    travel_time INTEGER,  -- en minutes
    travel_mode TEXT,  -- car, public_transport, walking, etc.
    distance REAL,  -- en km
    route_details TEXT,  -- détails du trajet en JSON (étapes, modes, etc.)
    scrape_url TEXT,  -- URL Google Maps utilisée
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE (job_id, travel_mode)
);
```

### Table: `applications`

Stocke les informations sur les candidatures envoyées.

```sql
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL,  -- to_apply, applied, rejected, interview, etc.
    applied_date DATE,
    cv_path TEXT,  -- chemin vers le CV personnalisé
    cover_letter_path TEXT,  -- chemin vers la lettre de motivation
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    UNIQUE (job_id, user_id)
);
```

### Table: `kanban_columns`

Définit les colonnes du tableau Kanban.

```sql
CREATE TABLE kanban_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name),
    UNIQUE (position)
);

-- Insertion des colonnes par défaut
INSERT INTO kanban_columns (name, description, position) VALUES
('Backlog', 'Nouvelles offres à trier', 1),
('To Be Reviewed', 'Offres à examiner en détail', 2),
('For Application', 'Offres pour lesquelles postuler', 3),
('Applied', 'Candidatures envoyées', 4),
('Rejected by me', 'Offres rejetées par l\'utilisateur', 5),
('Negative Answer', 'Réponses négatives reçues', 6);
```

### Table: `kanban_cards`

Associe les offres d'emploi aux colonnes du Kanban.

```sql
CREATE TABLE kanban_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    column_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE,
    UNIQUE (job_id)
);
```

### Table: `scraping_logs`

Enregistre les logs des opérations de scraping.

```sql
CREATE TABLE scraping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,  -- linkedin, indeed, glassdoor, etc.
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status TEXT NOT NULL,  -- running, completed, failed
    jobs_found INTEGER DEFAULT 0,
    jobs_added INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `system_settings`

Stocke les paramètres système de l'application.

```sql
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (key)
);

-- Insertion des paramètres par défaut
INSERT INTO system_settings (key, value, description) VALUES
('scraping_schedule', '0 0 * * *', 'Planification CRON pour le scraping automatique'),
('max_scraping_results', '100', 'Nombre maximum de résultats par source'),
('ollama_model', 'llama3:8b', 'Modèle Ollama à utiliser'),
('nocodb_url', 'http://localhost:8080', 'URL de l\'instance NocoDB');
```

## Indexes

Pour optimiser les performances de la base de données, les index suivants sont créés :

```sql
-- Index sur les offres d'emploi
CREATE INDEX idx_jobs_matching_score ON jobs(matching_score);
CREATE INDEX idx_jobs_date_posted ON jobs(date_posted);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max);

-- Index sur les compétences
CREATE INDEX idx_user_skills_name ON user_skills(skill_name);
CREATE INDEX idx_job_skills_name ON job_skills(skill_name);

-- Index sur les données de transport
CREATE INDEX idx_transport_travel_time ON transport_data(travel_time);

-- Index sur les candidatures
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date);
```

## Triggers

Des triggers sont utilisés pour maintenir l'intégrité des données et automatiser certaines opérations :

```sql
-- Mise à jour automatique du timestamp 'updated_at'
CREATE TRIGGER update_user_profile_timestamp
AFTER UPDATE ON user_profile
BEGIN
    UPDATE user_profile SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger similaire pour les autres tables avec 'updated_at'

-- Ajout automatique d'une carte Kanban lors de l'ajout d'une offre
CREATE TRIGGER add_job_to_kanban
AFTER INSERT ON jobs
BEGIN
    INSERT INTO kanban_cards (job_id, column_id, position)
    VALUES (NEW.id, (SELECT id FROM kanban_columns WHERE name = 'Backlog'), 
           (SELECT IFNULL(MAX(position), 0) + 1 FROM kanban_cards WHERE column_id = (SELECT id FROM kanban_columns WHERE name = 'Backlog')));
END;

-- Mise à jour du statut de l'offre lors du déplacement d'une carte
CREATE TRIGGER update_job_status_on_card_move
AFTER UPDATE OF column_id ON kanban_cards
BEGIN
    UPDATE jobs SET 
        status = (SELECT 
                    CASE 
                        WHEN name = 'Backlog' THEN 'new'
                        WHEN name = 'To Be Reviewed' THEN 'reviewing'
                        WHEN name = 'For Application' THEN 'to_apply'
                        WHEN name = 'Applied' THEN 'applied'
                        WHEN name = 'Rejected by me' THEN 'rejected_by_me'
                        WHEN name = 'Negative Answer' THEN 'rejected_by_company'
                        ELSE 'unknown'
                    END 
                  FROM kanban_columns WHERE id = NEW.column_id)
    WHERE id = NEW.job_id;
END;
```

## Vues

Des vues sont créées pour simplifier les requêtes courantes :

```sql
-- Vue des offres avec informations de l'entreprise
CREATE VIEW view_jobs_with_company AS
SELECT 
    j.id, j.title, j.description, j.location, j.job_type,
    j.salary_min, j.salary_max, j.salary_currency, j.salary_period,
    j.url, j.date_posted, j.source, j.matching_score, j.is_remote, j.status,
    c.name as company_name, c.website as company_website, c.industry as company_industry
FROM 
    jobs j
LEFT JOIN 
    companies c ON j.company_id = c.id;

-- Vue des offres avec temps de transport
CREATE VIEW view_jobs_with_transport AS
SELECT 
    j.id, j.title, j.location, j.matching_score, j.status,
    c.name as company_name,
    t.travel_time, t.travel_mode, t.distance
FROM 
    jobs j
LEFT JOIN 
    companies c ON j.company_id = c.id
LEFT JOIN 
    transport_data t ON j.id = t.job_id
WHERE 
    t.travel_mode = 'public_transport' OR t.travel_mode IS NULL;

-- Vue des candidatures avec détails
CREATE VIEW view_applications_details AS
SELECT 
    a.id as application_id, a.status as application_status, a.applied_date,
    j.id as job_id, j.title, j.location, j.matching_score,
    c.name as company_name,
    u.name as user_name
FROM 
    applications a
JOIN 
    jobs j ON a.job_id = j.id
JOIN 
    companies c ON j.company_id = c.id
JOIN 
    user_profile u ON a.user_id = u.id;

-- Vue du tableau Kanban
CREATE VIEW view_kanban_board AS
SELECT 
    kc.id as card_id, kc.position,
    col.id as column_id, col.name as column_name,
    j.id as job_id, j.title, j.location, j.matching_score, j.status,
    c.name as company_name
FROM 
    kanban_cards kc
JOIN 
    kanban_columns col ON kc.column_id = col.id
JOIN 
    jobs j ON kc.job_id = j.id
LEFT JOIN 
    companies c ON j.company_id = c.id
ORDER BY 
    col.position, kc.position;
```

## Migrations

Les migrations de la base de données seront gérées avec Alembic, ce qui permettra de faire évoluer le schéma de manière contrôlée au fil du temps.

## Considérations de Performance

- Les index sont créés sur les colonnes fréquemment utilisées dans les requêtes de filtrage et de tri
- Les vues sont utilisées pour simplifier les requêtes complexes
- Les triggers automatisent les opérations courantes et maintiennent l'intégrité des données
- Les contraintes d'unicité évitent les doublons dans les données

## Intégration avec NocoDB

NocoDB sera configuré pour se connecter à cette base de données SQLite et fournir une interface visuelle pour les tables principales, notamment la vue `view_kanban_board` qui sera utilisée pour l'interface Kanban.
