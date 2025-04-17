-- Ajout des contraintes de validation pour la table users
ALTER TABLE users ADD CONSTRAINT chk_email_format CHECK (email LIKE '%@%.%');
ALTER TABLE users ADD CONSTRAINT chk_password_length CHECK (LENGTH(password_hash) >= 8);
ALTER TABLE users ADD CONSTRAINT chk_first_name_length CHECK (LENGTH(first_name) >= 2);
ALTER TABLE users ADD CONSTRAINT chk_last_name_length CHECK (LENGTH(last_name) >= 2);

-- Ajout des contraintes pour la table jobs
ALTER TABLE jobs ADD CONSTRAINT chk_title_length CHECK (LENGTH(title) BETWEEN 2 AND 200);
ALTER TABLE jobs ADD CONSTRAINT chk_company_length CHECK (LENGTH(company) BETWEEN 2 AND 100);
ALTER TABLE jobs ADD CONSTRAINT chk_location_length CHECK (LENGTH(location) BETWEEN 2 AND 100);
ALTER TABLE jobs ADD CONSTRAINT chk_salary_range CHECK (
    (salary_min IS NULL AND salary_max IS NULL) OR
    (salary_min IS NOT NULL AND salary_max IS NOT NULL AND salary_min <= salary_max)
);
ALTER TABLE jobs ADD CONSTRAINT chk_experience_level CHECK (
    experience_level IN ('junior', 'mid', 'senior', 'lead', 'expert')
);
ALTER TABLE jobs ADD CONSTRAINT chk_job_type CHECK (
    job_type IN ('CDI', 'CDD', 'Stage', 'Alternance', 'Freelance')
);

-- Ajout des contraintes pour la table applications
ALTER TABLE applications ADD CONSTRAINT chk_status CHECK (
    status IN ('pending', 'applied', 'interview', 'offer', 'rejected', 'accepted')
);
ALTER TABLE applications ADD CONSTRAINT chk_applied_date CHECK (
    applied_date <= CURRENT_TIMESTAMP
);

-- Ajout des contraintes pour la table documents
ALTER TABLE documents ADD CONSTRAINT chk_name_length CHECK (LENGTH(name) BETWEEN 2 AND 100);
ALTER TABLE documents ADD CONSTRAINT chk_document_type CHECK (
    document_type IN ('CV', 'Lettre de motivation', 'Contrat', 'Autre')
);

-- Ajout des contraintes pour la table user_profiles
ALTER TABLE user_profiles ADD CONSTRAINT chk_phone_format CHECK (
    phone IS NULL OR phone REGEXP '^[0-9]{10}$'
);
ALTER TABLE user_profiles ADD CONSTRAINT chk_skills_length CHECK (
    skills IS NULL OR LENGTH(skills) <= 1000
);
ALTER TABLE user_profiles ADD CONSTRAINT chk_experience_length CHECK (
    experience IS NULL OR LENGTH(experience) <= 2000
);
ALTER TABLE user_profiles ADD CONSTRAINT chk_education_length CHECK (
    education IS NULL OR LENGTH(education) <= 2000
);

-- Ajout des contraintes pour la table search_preferences
ALTER TABLE search_preferences ADD CONSTRAINT chk_frequency CHECK (
    frequency IN ('daily', 'weekly', 'monthly')
);

-- Ajout des contraintes pour la table document_templates
ALTER TABLE document_templates ADD CONSTRAINT chk_template_type CHECK (
    template_type IN ('CV', 'Lettre de motivation', 'Email', 'Autre')
);
ALTER TABLE document_templates ADD CONSTRAINT chk_content_length CHECK (LENGTH(content) <= 10000);

-- Ajout des contraintes pour la table generated_documents
ALTER TABLE generated_documents ADD CONSTRAINT chk_rating CHECK (
    rating IS NULL OR (rating >= 1 AND rating <= 5)
);
ALTER TABLE generated_documents ADD CONSTRAINT chk_version CHECK (
    version IS NULL OR version >= 1
); 