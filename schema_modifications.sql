-- Modifications du schéma de données pour supporter les nouvelles fonctionnalités

-- 1. Ajout de la table pour les domiciles multiples
CREATE TABLE IF NOT EXISTS user_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,           -- Ex: "Domicile Principal", "Domicile Secondaire"
    address TEXT NOT NULL,        -- Adresse complète
    is_primary BOOLEAN DEFAULT 0, -- 1 pour le domicile principal, 0 pour les autres
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);

-- 2. Modification de la table transport_data pour supporter les domiciles multiples
-- D'abord, renommer la table existante pour préserver les données
ALTER TABLE transport_data RENAME TO transport_data_old;

-- Créer la nouvelle table avec support pour les domiciles multiples
CREATE TABLE IF NOT EXISTS transport_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,  -- Référence à user_locations
    travel_time INTEGER,
    travel_mode TEXT,
    distance REAL,
    route_details TEXT,
    scrape_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE CASCADE,
    UNIQUE (job_id, location_id, travel_mode)
);

-- 3. Ajout de la table pour les préférences de recherche
CREATE TABLE IF NOT EXISTS search_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,           -- Nom de l'ensemble de préférences
    is_active BOOLEAN DEFAULT 1,  -- Indique si cet ensemble est actif
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);

-- 4. Ajout de la table pour les catégories de recherche
CREATE TABLE IF NOT EXISTS search_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- Ex: "Compétences techniques", "Titres de poste", "Industries"
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ajout de la table pour les mots-clés de recherche avec pondération
CREATE TABLE IF NOT EXISTS search_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preference_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    weight REAL DEFAULT 1.0,      -- Pondération entre 0.0 et 1.0
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preference_id) REFERENCES search_preferences(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES search_categories(id) ON DELETE CASCADE
);

-- 6. Ajout de la table pour les suggestions de recherche générées par l'IA
CREATE TABLE IF NOT EXISTS search_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    reason TEXT,                  -- Raison de la suggestion (ex: "Basé sur votre expérience chez X")
    is_applied BOOLEAN DEFAULT 0, -- Indique si la suggestion a été appliquée
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES search_categories(id) ON DELETE CASCADE
);

-- 7. Ajout de la table pour les API alternatives
CREATE TABLE IF NOT EXISTS api_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- Ex: "Ollama Local", "OpenAI", "Anthropic"
    api_type TEXT NOT NULL,       -- Ex: "local", "remote"
    api_url TEXT NOT NULL,
    api_key TEXT,
    models TEXT,                  -- JSON array des modèles disponibles
    cost_per_1k_tokens REAL,      -- Coût par 1000 tokens
    is_active BOOLEAN DEFAULT 1,
    priority INTEGER DEFAULT 0,   -- Priorité (0 = plus haute)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ajout de la table pour l'historique d'utilisation des API
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL, -- Ex: "matching", "content_generation"
    tokens_used INTEGER,
    estimated_cost REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE
);

-- 9. Ajout de la table pour la détection des doublons
CREATE TABLE IF NOT EXISTS job_duplicates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_job_id INTEGER NOT NULL,
    duplicate_job_id INTEGER NOT NULL,
    similarity_score REAL,        -- Score de similarité entre 0.0 et 1.0
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (duplicate_job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 10. Ajout de champs pour le feedback Kanban dans la table jobs
ALTER TABLE jobs ADD COLUMN kanban_feedback_score INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN kanban_last_column TEXT;
ALTER TABLE jobs ADD COLUMN kanban_time_spent INTEGER DEFAULT 0;  -- Temps passé dans chaque colonne en secondes

-- 11. Insertion des catégories de recherche par défaut
INSERT OR IGNORE INTO search_categories (name, description) VALUES 
('technical_skills', 'Compétences techniques'),
('job_titles', 'Titres de poste'),
('industries', 'Industries et secteurs d''activité'),
('locations', 'Localisations géographiques'),
('contract_types', 'Types de contrat'),
('seniority_levels', 'Niveaux d''expérience'),
('company_sizes', 'Tailles d''entreprise'),
('keywords', 'Mots-clés généraux');

-- 12. Insertion des fournisseurs d'API par défaut
INSERT OR IGNORE INTO api_providers (name, api_type, api_url, models, cost_per_1k_tokens, priority) VALUES 
('Ollama Local', 'local', 'http://localhost:11434', '["llama3:8b", "llama3:70b", "mistral:7b"]', 0.0, 0),
('OpenAI', 'remote', 'https://api.openai.com/v1', '["gpt-3.5-turbo", "gpt-4"]', 0.002, 1),
('Anthropic', 'remote', 'https://api.anthropic.com/v1', '["claude-3-haiku", "claude-3-sonnet"]', 0.003, 2),
('Mistral AI', 'remote', 'https://api.mistral.ai/v1', '["mistral-small", "mistral-medium"]', 0.0015, 3);

-- 13. Migration des données de transport existantes
INSERT INTO user_locations (user_id, name, address, is_primary)
SELECT 1, 'Domicile Principal', 'Adresse non spécifiée', 1
WHERE NOT EXISTS (SELECT 1 FROM user_locations WHERE user_id = 1 AND is_primary = 1);

-- Récupérer l'ID du domicile principal
INSERT INTO transport_data (job_id, location_id, travel_time, travel_mode, distance, route_details, scrape_url)
SELECT 
    t.job_id, 
    (SELECT id FROM user_locations WHERE user_id = 1 AND is_primary = 1), 
    t.travel_time, 
    t.travel_mode, 
    t.distance, 
    t.route_details, 
    t.scrape_url
FROM transport_data_old t;

-- 14. Création d'un ensemble de préférences de recherche par défaut
INSERT OR IGNORE INTO search_preferences (user_id, name, is_active)
SELECT 1, 'Préférences par défaut', 1
WHERE NOT EXISTS (SELECT 1 FROM search_preferences WHERE user_id = 1 AND is_active = 1);
