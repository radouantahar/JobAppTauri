#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'initialisation de la base de données pour l'application d'automatisation de recherche d'emploi
Ce script crée la structure de la base de données SQLite et initialise les tables nécessaires.
"""

import os
import sys
import sqlite3
import argparse
import json
from datetime import datetime
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chemin par défaut de la base de données
DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jobs.db')

def create_tables(conn, cursor):
    """Crée les tables de la base de données."""
    
    # Table des utilisateurs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        primary_home TEXT,
        secondary_home TEXT,
        cv_path TEXT,
        cv_last_updated TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des entreprises
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        website TEXT,
        description TEXT,
        industry TEXT,
        size TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des offres d'emploi
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company_id INTEGER,
        description TEXT,
        location TEXT,
        url TEXT,
        source TEXT,
        published_at TIMESTAMP,
        salary TEXT,
        job_type TEXT,
        remote BOOLEAN,
        matching_score REAL,
        primary_commute_time INTEGER,
        primary_commute_distance REAL,
        primary_commute_mode TEXT,
        secondary_commute_time INTEGER,
        secondary_commute_distance REAL,
        secondary_commute_mode TEXT,
        is_duplicate BOOLEAN DEFAULT 0,
        original_job_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (original_job_id) REFERENCES jobs(id)
    )
    ''')
    
    # Table des compétences
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table de liaison entre offres et compétences
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS job_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        importance REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE(job_id, skill_id)
    )
    ''')
    
    # Table des compétences de l'utilisateur
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        level REAL DEFAULT 1.0,
        years_experience REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE(user_id, skill_id)
    )
    ''')
    
    # Table des colonnes Kanban
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS kanban_columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des cartes Kanban
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS kanban_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        column_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        notes TEXT,
        applied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
    ''')
    
    # Table des documents générés
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS generated_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
    ''')
    
    # Table des templates de documents
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS document_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des catégories de préférences de recherche
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS search_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des ensembles de préférences de recherche
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS search_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
    )
    ''')
    
    # Table des mots-clés de recherche
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS search_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preference_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        keyword TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (preference_id) REFERENCES search_preferences(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES search_categories(id) ON DELETE CASCADE
    )
    ''')
    
    # Table du feedback Kanban
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS kanban_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        column_id INTEGER NOT NULL,
        column_name TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
    )
    ''')
    
    # Table des mots-clés du feedback Kanban
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS kanban_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        keyword TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        occurrence INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES kanban_feedback(id) ON DELETE CASCADE
    )
    ''')
    
    # Table des fournisseurs d'API LLM
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS api_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        api_type TEXT NOT NULL,
        api_url TEXT NOT NULL,
        api_key TEXT,
        models TEXT,
        is_active BOOLEAN DEFAULT 1,
        priority INTEGER DEFAULT 0,
        cost_per_1k_tokens REAL DEFAULT 0.0,
        monthly_quota INTEGER DEFAULT 0,
        usage_this_month INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table des modèles d'API LLM
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS api_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        model_name TEXT NOT NULL,
        model_type TEXT NOT NULL,
        context_length INTEGER DEFAULT 4096,
        cost_per_1k_input_tokens REAL DEFAULT 0.0,
        cost_per_1k_output_tokens REAL DEFAULT 0.0,
        is_available BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE
    )
    ''')
    
    # Table de l'utilisation des API LLM
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        operation_type TEXT NOT NULL,
        tokens_used INTEGER NOT NULL,
        estimated_cost REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE
    )
    ''')
    
    # Créer les index pour améliorer les performances
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_jobs_matching_score ON jobs(matching_score)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs(published_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON job_skills(job_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON job_skills(skill_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_kanban_cards_job_id ON kanban_cards(job_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_search_keywords_preference_id ON search_keywords(preference_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_search_keywords_category_id ON search_keywords(category_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_api_usage_provider_id ON api_usage(provider_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_api_models_provider_id ON api_models(provider_id)')
    
    conn.commit()
    logger.info("Tables créées avec succès")

def initialize_default_data(conn, cursor):
    """Initialise les données par défaut dans la base de données."""
    
    # Vérifier si un profil utilisateur existe déjà
    cursor.execute("SELECT COUNT(*) FROM user_profile")
    if cursor.fetchone()[0] == 0:
        # Créer un profil utilisateur par défaut
        cursor.execute('''
        INSERT INTO user_profile (name, email, primary_home)
        VALUES (?, ?, ?)
        ''', ('Utilisateur', 'utilisateur@exemple.com', 'Adresse principale'))
        logger.info("Profil utilisateur par défaut créé")
    
    # Initialiser les colonnes Kanban par défaut
    cursor.execute("SELECT COUNT(*) FROM kanban_columns")
    if cursor.fetchone()[0] == 0:
        columns = [
            ('New', 0, 'Nouvelles offres'),
            ('To Apply', 1, 'Offres à postuler'),
            ('For Application', 2, 'Offres sélectionnées pour candidature'),
            ('Applied', 3, 'Candidatures envoyées'),
            ('Interview', 4, 'Entretiens programmés'),
            ('Offer', 5, 'Offres reçues'),
            ('Rejected by Company', 6, 'Refusé par l\'entreprise'),
            ('Rejected by me', 7, 'Refusé par moi'),
            ('Not Interested', 8, 'Pas intéressé')
        ]
        
        cursor.executemany('''
        INSERT INTO kanban_columns (name, position, description)
        VALUES (?, ?, ?)
        ''', columns)
        logger.info("Colonnes Kanban par défaut créées")
    
    # Initialiser les catégories de préférences de recherche
    cursor.execute("SELECT COUNT(*) FROM search_categories")
    if cursor.fetchone()[0] == 0:
        categories = [
            ('skills', 'Compétences techniques'),
            ('soft_skills', 'Compétences comportementales'),
            ('industries', 'Secteurs d\'activité'),
            ('job_titles', 'Titres de poste'),
            ('companies', 'Entreprises'),
            ('locations', 'Localisations'),
            ('conditions', 'Conditions de travail'),
            ('keywords', 'Mots-clés généraux')
        ]
        
        cursor.executemany('''
        INSERT INTO search_categories (name, description)
        VALUES (?, ?)
        ''', categories)
        logger.info("Catégories de préférences par défaut créées")
    
    # Initialiser un ensemble de préférences par défaut
    cursor.execute("SELECT id FROM user_profile LIMIT 1")
    user_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM search_preferences")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO search_preferences (user_id, name, is_active)
        VALUES (?, ?, ?)
        ''', (user_id, 'Préférences par défaut', 1))
        
        preference_id = cursor.lastrowid
        logger.info("Ensemble de préférences par défaut créé")
        
        # Ajouter quelques mots-clés d'exemple
        cursor.execute("SELECT id FROM search_categories WHERE name = 'skills'")
        skills_category_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM search_categories WHERE name = 'job_titles'")
        job_titles_category_id = cursor.fetchone()[0]
        
        example_keywords = [
            (preference_id, skills_category_id, 'python', 0.9),
            (preference_id, skills_category_id, 'javascript', 0.8),
            (preference_id, skills_category_id, 'sql', 0.7),
            (preference_id, job_titles_category_id, 'développeur', 1.0),
            (preference_id, job_titles_category_id, 'ingénieur', 0.9),
            (preference_id, job_titles_category_id, 'data scientist', 0.8)
        ]
        
        cursor.executemany('''
        INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
        VALUES (?, ?, ?, ?)
        ''', example_keywords)
        logger.info("Mots-clés d'exemple ajoutés")
    
    # Initialiser les templates de documents par défaut
    cursor.execute("SELECT COUNT(*) FROM document_templates")
    if cursor.fetchone()[0] == 0:
        # Template de CV
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates', 'cv_prompt.txt'), 'r') as f:
            cv_template = f.read()
        
        # Template de lettre de motivation
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates', 'cover_letter_prompt.txt'), 'r') as f:
            cover_letter_template = f.read()
        
        templates = [
            ('CV Standard', 'cv', cv_template),
            ('Lettre de motivation standard', 'coverLetter', cover_letter_template),
            ('Email de candidature', 'email', 'Objet: Candidature pour le poste de {{job.title}} chez {{job.company}}\n\nBonjour,\n\nJe vous soumets ma candidature pour le poste de {{job.title}}...')
        ]
        
        cursor.executemany('''
        INSERT INTO document_templates (name, type, content)
        VALUES (?, ?, ?)
        ''', templates)
        logger.info("Templates de documents par défaut créés")
    
    # Initialiser le fournisseur Ollama par défaut
    cursor.execute("SELECT COUNT(*) FROM api_providers")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO api_providers (
            name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Ollama Local", 
            "local", 
            "http://localhost:11434", 
            json.dumps(["llama3:8b", "llama3:70b", "mistral:7b", "gemma:7b"]), 
            1, 
            10,
            0.0
        ))
        
        provider_id = cursor.lastrowid
        
        # Ajouter les modèles Ollama par défaut
        models = [
            (provider_id, "llama3:8b", "chat", 4096, 0.0, 0.0),
            (provider_id, "llama3:70b", "chat", 4096, 0.0, 0.0),
            (provider_id, "mistral:7b", "chat", 8192, 0.0, 0.0),
            (provider_id, "gemma:7b", "chat", 8192, 0.0, 0.0)
        ]
        
        cursor.executemany('''
        INSERT INTO api_models (
            provider_id, model_name, model_type, context_length, 
            cost_per_1k_input_tokens, cost_per_1k_output_tokens
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ''', models)
        
        logger.info("Fournisseur Ollama et modèles par défaut créés")
    
    # Initialiser la configuration du feedback Kanban
    cursor.execute("SELECT COUNT(*) FROM kanban_feedback")
    if cursor.fetchone()[0] == 0:
        # Récupérer les colonnes Kanban
        cursor.execute("SELECT id, name FROM kanban_columns")
        columns = cursor.fetchall()
        
        # Configuration par défaut
        default_config = {
            "For Application": {"feedback_type": "positive", "weight": 1.0},
            "Applied": {"feedback_type": "positive", "weight": 0.8},
            "Interview": {"feedback_type": "positive", "weight": 1.0},
            "Offer": {"feedback_type": "positive", "weight": 1.0},
            "Rejected by Company": {"feedback_type": "neutral", "weight": 0.0},
            "Rejected by me": {"feedback_type": "negative", "weight": 1.0},
            "Not Interested": {"feedback_type": "negative", "weight": 0.8},
            "To Apply": {"feedback_type": "neutral", "weight": 0.0},
            "New": {"feedback_type": "neutral", "weight": 0.0}
        }
        
        for col_id, col_name in columns:
            if col_name in default_config:
                feedback_type = default_config[col_name]["feedback_type"]
                weight = default_config[col_name]["weight"]
            else:
                feedback_type = "neutral"
                weight = 0.0
            
            cursor.execute('''
            INSERT INTO kanban_feedback (column_id, column_name, feedback_type, weight)
            VALUES (?, ?, ?, ?)
            ''', (col_id, col_name, feedback_type, weight))
        
        logger.info("Configuration du feedback Kanban créée")
    
    conn.commit()
    logger.info("Données par défaut initialisées avec succès")

def main():
    parser = argparse.ArgumentParser(description='Initialisation de la base de données pour l\'application de recherche d\'emploi')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default=DEFAULT_DB_PATH)
    parser.add_argument('--reset', help='Réinitialiser la base de données existante', action='store_true')
    
    args = parser.parse_args()
    
    db_path = args.db
    
    # Vérifier si la base de données existe déjà
    db_exists = os.path.exists(db_path)
    
    if db_exists and args.reset:
        logger.warning(f"Suppression de la base de données existante: {db_path}")
        os.remove(db_path)
        db_exists = False
    
    # Créer le répertoire parent si nécessaire
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    # Connexion à la base de données
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Activer les clés étrangères
        cursor.execute('PRAGMA foreign_keys = ON')
        
        # Créer les tables
        create_tables(conn, cursor)
        
        # Initialiser les données par défaut
        initialize_default_data(conn, cursor)
        
        logger.info(f"Base de données initialisée avec succès: {db_path}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation de la base de données: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
