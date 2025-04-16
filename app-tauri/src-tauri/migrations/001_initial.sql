CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    location TEXT,
    skills TEXT,
    experience TEXT,
    education TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS llm_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    api_key TEXT,
    model TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_applications INTEGER DEFAULT 0,
    pending_applications INTEGER DEFAULT 0,
    accepted_applications INTEGER DEFAULT 0,
    rejected_applications INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    primary_home TEXT NOT NULL,
    secondary_home TEXT,
    cv_path TEXT,
    cv_last_updated TEXT
);

CREATE TABLE IF NOT EXISTS kanban_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT,
    "limit" INTEGER
);

CREATE TABLE IF NOT EXISTS kanban_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    column_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    notes TEXT,
    applied_at TEXT,
    follow_up_date TEXT,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id)
);

CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    notes TEXT,
    outcome TEXT,
    FOREIGN KEY (card_id) REFERENCES kanban_cards(id)
);

CREATE TABLE IF NOT EXISTS search_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_used TEXT
);

CREATE TABLE IF NOT EXISTS search_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preference_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    priority INTEGER,
    FOREIGN KEY (preference_id) REFERENCES search_preferences(id)
);

CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    weight INTEGER NOT NULL,
    required BOOLEAN DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES search_categories(id)
);

CREATE TABLE IF NOT EXISTS llm_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    max_tokens INTEGER NOT NULL,
    supports_json BOOLEAN DEFAULT 0,
    is_fine_tuned BOOLEAN DEFAULT 0,
    FOREIGN KEY (provider_id) REFERENCES llm_providers(id)
);

CREATE TABLE IF NOT EXISTS document_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT,
    is_default BOOLEAN DEFAULT 0,
    language TEXT
);

CREATE TABLE IF NOT EXISTS generated_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    version INTEGER,
    rating INTEGER,
    comments TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (template_id) REFERENCES document_templates(id)
); 