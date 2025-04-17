-- Suppression des tables redondantes
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_profile;

-- Création de la table users pour l'authentification
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Création de la table user_profiles consolidée
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    primary_home TEXT NOT NULL,
    secondary_home TEXT,
    skills TEXT,
    experience TEXT,
    education TEXT,
    cv_path TEXT,
    cv_last_updated TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Mise à jour de la table documents pour utiliser la nouvelle structure
ALTER TABLE documents RENAME COLUMN user_id TO user_id_old;
ALTER TABLE documents ADD COLUMN user_id TEXT;
UPDATE documents SET user_id = user_id_old;
ALTER TABLE documents DROP COLUMN user_id_old;
ALTER TABLE documents ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 