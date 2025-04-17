-- Ajout des index pour optimiser les requêtes fréquentes

-- Index pour la table jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);

-- Index pour la table applications
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_date ON applications(applied_date);

-- Index pour la table documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Index pour la table user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);

-- Index pour la table search_preferences
CREATE INDEX IF NOT EXISTS idx_search_preferences_user_id ON search_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_search_preferences_is_active ON search_preferences(is_active);

-- Index pour la table search_categories
CREATE INDEX IF NOT EXISTS idx_search_categories_preference_id ON search_categories(preference_id);

-- Index pour la table keywords
CREATE INDEX IF NOT EXISTS idx_keywords_category_id ON keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);

-- Index pour la table llm_models
CREATE INDEX IF NOT EXISTS idx_llm_models_provider_id ON llm_models(provider_id);

-- Index pour la table document_templates
CREATE INDEX IF NOT EXISTS idx_document_templates_template_type ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_default ON document_templates(is_default);

-- Index pour la table generated_documents
CREATE INDEX IF NOT EXISTS idx_generated_documents_job_id ON generated_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template_id ON generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_document_type ON generated_documents(document_type); 