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
- Configuration de l'interface Tauri
- Historique des actions utilisateur

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
    location_id INTEGER NOT NULL,  -- référence à user_locations
    travel_time INTEGER,  -- en minutes
    travel_mode TEXT,  -- car, public_transport, walking, etc.
    distance REAL,  -- en km
    route_details TEXT,  -- détails du trajet en JSON (étapes, modes, etc.)
    scrape_url TEXT,  -- URL Google Maps utilisée
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE CASCADE,
    UNIQUE (job_id, location_id, travel_mode)
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
('nocodb_url', 'http://localhost:8080', 'URL de l\'instance NocoDB'),
('tauri_theme', 'system', 'Thème de l\'interface Tauri'),
('tauri_window_size', '{"width": 1200, "height": 800}', 'Taille de la fenêtre Tauri'),
('tauri_window_position', '{"x": 100, "y": 100}', 'Position de la fenêtre Tauri');
```

### Table: `duplicate_jobs`

Stocke les informations sur les offres d'emploi identifiées comme doublons.

```sql
CREATE TABLE duplicate_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_job_id INTEGER NOT NULL,
    duplicate_job_id INTEGER NOT NULL,
    similarity_score REAL NOT NULL,
    match_type TEXT NOT NULL,  -- url, content, title
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (duplicate_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE (original_job_id, duplicate_job_id)
);
```

### Table: `user_locations`

Stocke les adresses de domicile de l'utilisateur.

```sql
CREATE TABLE user_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    latitude REAL,
    longitude REAL,
    transport_preferences TEXT,  -- stocké en JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
```

### Table: `search_preferences`

Stocke les préférences de recherche de l'utilisateur.

```sql
CREATE TABLE search_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    keywords TEXT NOT NULL,  -- stocké en JSON
    weightings TEXT NOT NULL,  -- stocké en JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
```

### Table: `ai_suggestions`

Stocke les suggestions générées par l'IA.

```sql
CREATE TABLE ai_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    suggestion_type TEXT NOT NULL,  -- keywords, companies, positions
    content TEXT NOT NULL,  -- stocké en JSON
    confidence_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
```

### Table: `kanban_feedback`

Stocke les analyses du feedback du tableau Kanban.

```sql
CREATE TABLE kanban_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    feedback_type TEXT NOT NULL,  -- accepted, rejected, ignored
    analysis TEXT,  -- stocké en JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
```

### Table: `llm_api_config`

Stocke la configuration des API LLM.

```sql
CREATE TABLE llm_api_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,  -- ollama, openai, etc.
    model_name TEXT NOT NULL,
    api_key TEXT,
    base_url TEXT,
    max_tokens INTEGER,
    temperature REAL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, model_name)
);
```

### Table: `tauri_settings`

Stocke les paramètres spécifiques à l'interface Tauri.

```sql
CREATE TABLE tauri_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,  -- stocké en JSON
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (key)
);

-- Insertion des paramètres par défaut
INSERT INTO tauri_settings (key, value, description) VALUES
('window_state', '{"width": 1200, "height": 800, "x": 100, "y": 100}', 'État de la fenêtre Tauri'),
('theme', 'system', 'Thème de l\'interface'),
('notifications', '{"enabled": true, "sound": true}', 'Paramètres de notification'),
('shortcuts', '{"search": "Ctrl+K", "new_job": "Ctrl+N"}', 'Raccourcis clavier');
```

### Table: `user_actions`

Stocke l'historique des actions de l'utilisateur.

```sql
CREATE TABLE user_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,  -- search, apply, reject, etc.
    target_id INTEGER,  -- id de l\'offre, de la candidature, etc.
    target_type TEXT,  -- job, application, etc.
    details TEXT,  -- stocké en JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);
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
CREATE INDEX idx_transport_location ON transport_data(location_id);

-- Index sur les candidatures
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date);

-- Index sur les doublons
CREATE INDEX idx_duplicate_jobs_similarity ON duplicate_jobs(similarity_score);

-- Index sur les préférences de recherche
CREATE INDEX idx_search_preferences_user ON search_preferences(user_id, is_active);

-- Index sur les suggestions IA
CREATE INDEX idx_ai_suggestions_user ON ai_suggestions(user_id, suggestion_type);

-- Index sur le feedback Kanban
CREATE INDEX idx_kanban_feedback_user ON kanban_feedback(user_id, feedback_type);

-- Index sur les actions utilisateur
CREATE INDEX idx_user_actions_type ON user_actions(action_type);
CREATE INDEX idx_user_actions_date ON user_actions(created_at);
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

-- Mise à jour automatique du feedback Kanban
CREATE TRIGGER update_kanban_feedback
AFTER UPDATE OF status ON applications
BEGIN
    INSERT INTO kanban_feedback (user_id, job_id, feedback_type)
    VALUES (NEW.user_id, NEW.job_id, 
            CASE 
                WHEN NEW.status = 'rejected' THEN 'rejected'
                WHEN NEW.status = 'interview' THEN 'accepted'
                ELSE NULL
            END);
END;

-- Enregistrement automatique des actions utilisateur
CREATE TRIGGER log_user_action
AFTER INSERT ON applications
BEGIN
    INSERT INTO user_actions (user_id, action_type, target_id, target_type, details)
    VALUES (NEW.user_id, 'apply', NEW.job_id, 'job', 
            json_object('status', NEW.status, 'date', NEW.applied_date));
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
    t.travel_time, t.travel_mode, t.distance,
    l.address as home_address
FROM 
    jobs j
LEFT JOIN 
    companies c ON j.company_id = c.id
LEFT JOIN 
    transport_data t ON j.id = t.job_id
LEFT JOIN
    user_locations l ON t.location_id = l.id
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

-- Vue des doublons d'offres
CREATE VIEW view_duplicate_jobs AS
SELECT 
    d.id as duplicate_id,
    j1.id as original_job_id, j1.title as original_title, j1.url as original_url,
    j2.id as duplicate_job_id, j2.title as duplicate_title, j2.url as duplicate_url,
    d.similarity_score, d.match_type, d.created_at
FROM 
    duplicate_jobs d
JOIN 
    jobs j1 ON d.original_job_id = j1.id
JOIN 
    jobs j2 ON d.duplicate_job_id = j2.id;

-- Vue des suggestions IA
CREATE VIEW view_ai_suggestions AS
SELECT 
    s.id, s.user_id, s.suggestion_type,
    u.name as user_name,
    s.content, s.confidence_score, s.created_at
FROM 
    ai_suggestions s
JOIN 
    user_profile u ON s.user_id = u.id;

-- Vue des actions utilisateur récentes
CREATE VIEW view_recent_user_actions AS
SELECT 
    ua.id, ua.action_type, ua.target_type,
    u.name as user_name,
    ua.details, ua.created_at
FROM 
    user_actions ua
JOIN 
    user_profile u ON ua.user_id = u.id
ORDER BY 
    ua.created_at DESC
LIMIT 100;
```

## Migrations

Les migrations de la base de données seront gérées avec Alembic, ce qui permettra de faire évoluer le schéma de manière contrôlée au fil du temps.

## Considérations de Performance

- Les index sont créés sur les colonnes fréquemment utilisées dans les requêtes de filtrage et de tri
- Les vues sont utilisées pour simplifier les requêtes complexes
- Les triggers automatisent les opérations courantes et maintiennent l'intégrité des données
- Les contraintes d'unicité évitent les doublons dans les données
- Les tables sont optimisées pour les opérations de lecture fréquentes
- Les données JSON sont utilisées judicieusement pour les champs flexibles

## Intégration avec NocoDB

NocoDB sera configuré pour se connecter à cette base de données SQLite et fournir une interface visuelle pour les tables principales, notamment la vue `view_kanban_board` qui sera utilisée pour l'interface Kanban.
