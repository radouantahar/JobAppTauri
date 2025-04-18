-- Suppression des colonnes obsolètes
ALTER TABLE applications DROP COLUMN company_name;
ALTER TABLE applications DROP COLUMN position;
ALTER TABLE applications DROP COLUMN application_date;

-- Ajout de la colonne job_id
ALTER TABLE applications ADD COLUMN job_id TEXT NOT NULL;

-- Ajout de la contrainte de clé étrangère pour job_id
ALTER TABLE applications ADD FOREIGN KEY (job_id) REFERENCES jobs(id); 