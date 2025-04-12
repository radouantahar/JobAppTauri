#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script principal de l'application d'automatisation de recherche d'emploi
Ce script fournit une interface en ligne de commande pour utiliser l'application
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Créer le répertoire de logs s'il n'existe pas
os.makedirs("logs", exist_ok=True)

# Charger les variables d'environnement
load_dotenv()

# Ajouter le répertoire courant au PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importer les modules de l'application
try:
    from modules.cv_parser import CVParser
    from modules.job_scraper import JobScraper
    from modules.transport_scraper import TransportScraper
    from modules.matching_engine import MatchingEngine
    from modules.content_generator import ContentGenerator
    from modules.nocodb_integration import NocoDBIntegration
except ImportError as e:
    logger.error(f"Erreur lors de l'importation des modules: {e}")
    print(f"Erreur: {e}")
    print("Assurez-vous que tous les modules sont présents dans le répertoire 'modules/'")
    sys.exit(1)

def parse_args():
    """Parse les arguments de la ligne de commande."""
    parser = argparse.ArgumentParser(description='Application d\'automatisation de recherche d\'emploi')
    
    # Sous-commandes
    subparsers = parser.add_subparsers(dest='command', help='Commande à exécuter')
    
    # Commande: import-cv
    import_cv_parser = subparsers.add_parser('import-cv', help='Importer un CV')
    import_cv_parser.add_argument('--file', required=True, help='Chemin vers le fichier CV (PDF)')
    
    # Commande: scrape-jobs
    scrape_parser = subparsers.add_parser('scrape-jobs', help='Scraper les offres d\'emploi')
    scrape_parser.add_argument('--keywords', required=True, help='Mots-clés pour la recherche')
    scrape_parser.add_argument('--location', help='Localisation pour la recherche')
    scrape_parser.add_argument('--limit', type=int, default=50, help='Nombre maximum d\'offres à scraper')
    scrape_parser.add_argument('--sources', help='Sources à utiliser (linkedin,indeed,glassdoor)', default='linkedin,indeed')
    
    # Commande: calculate-transport
    transport_parser = subparsers.add_parser('calculate-transport', help='Calculer les temps de transport')
    transport_parser.add_argument('--home', help='Adresse du domicile')
    transport_parser.add_argument('--limit', type=int, default=10, help='Nombre maximum d\'offres à traiter')
    
    # Commande: calculate-matching
    matching_parser = subparsers.add_parser('calculate-matching', help='Calculer les scores de matching')
    matching_parser.add_argument('--limit', type=int, help='Nombre maximum d\'offres à traiter')
    matching_parser.add_argument('--job-id', type=int, help='ID de l\'offre à évaluer')
    
    # Commande: generate-documents
    generate_parser = subparsers.add_parser('generate-documents', help='Générer des CV et lettres de motivation')
    generate_parser.add_argument('--job-id', type=int, required=True, help='ID de l\'offre d\'emploi')
    generate_parser.add_argument('--cv-only', action='store_true', help='Générer uniquement le CV')
    generate_parser.add_argument('--letter-only', action='store_true', help='Générer uniquement la lettre de motivation')
    
    # Commande: sync-nocodb
    nocodb_parser = subparsers.add_parser('sync-nocodb', help='Synchroniser avec NocoDB')
    nocodb_parser.add_argument('--init', action='store_true', help='Initialiser l\'intégration')
    nocodb_parser.add_argument('--sync-all', action='store_true', help='Synchroniser toutes les offres')
    nocodb_parser.add_argument('--sync-statuses', action='store_true', help='Synchroniser les statuts depuis NocoDB')
    nocodb_parser.add_argument('--get-url', action='store_true', help='Récupérer l\'URL de l\'interface NocoDB')
    
    # Commande: filter-jobs
    filter_parser = subparsers.add_parser('filter-jobs', help='Filtrer les offres d\'emploi')
    filter_parser.add_argument('--min-score', type=int, default=50, help='Score minimum')
    filter_parser.add_argument('--min-salary', type=int, default=50000, help='Salaire minimum')
    filter_parser.add_argument('--max-travel', type=int, default=60, help='Temps de trajet maximum en minutes')
    
    # Arguments globaux
    parser.add_argument('--db', help='Chemin vers la base de données SQLite')
    
    return parser.parse_args()

def main():
    """Fonction principale de l'application."""
    args = parse_args()
    
    # Récupérer le chemin de la base de données
    db_path = args.db or os.getenv('DB_PATH', 'jobs.db')
    
    # Vérifier que la base de données existe
    if not os.path.exists(db_path):
        logger.error(f"Base de données non trouvée: {db_path}")
        print(f"Erreur: Base de données non trouvée: {db_path}")
        print("Exécutez d'abord le script setup_database.py pour initialiser la base de données")
        return 1
    
    # Exécuter la commande appropriée
    if args.command == 'import-cv':
        return import_cv(args.file, db_path)
    elif args.command == 'scrape-jobs':
        return scrape_jobs(args.keywords, args.location, args.limit, args.sources, db_path)
    elif args.command == 'calculate-transport':
        return calculate_transport(args.home, args.limit, db_path)
    elif args.command == 'calculate-matching':
        return calculate_matching(args.job_id, args.limit, db_path)
    elif args.command == 'generate-documents':
        return generate_documents(args.job_id, args.cv_only, args.letter_only, db_path)
    elif args.command == 'sync-nocodb':
        return sync_nocodb(args.init, args.sync_all, args.sync_statuses, args.get_url, db_path)
    elif args.command == 'filter-jobs':
        return filter_jobs(args.min_score, args.min_salary, args.max_travel, db_path)
    else:
        print("Erreur: Commande non reconnue")
        print("Utilisez --help pour afficher les commandes disponibles")
        return 1

def import_cv(file_path, db_path):
    """Importe un CV dans la base de données."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"Fichier CV non trouvé: {file_path}")
            print(f"Erreur: Fichier CV non trouvé: {file_path}")
            return 1
            
        print(f"Importation du CV: {file_path}")
        
        # Créer le parser de CV
        cv_parser = CVParser(db_path)
        
        # Parser le CV
        result = cv_parser.parse_cv(file_path)
        
        # Afficher le résultat
        print(f"CV importé avec succès: {result['name']}")
        print(f"Compétences extraites: {len(result['skills'])}")
        print(f"Expériences extraites: {len(result['experiences'])}")
        print(f"Formations extraites: {len(result['education'])}")
        
        # Fermer la connexion
        cv_parser.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors de l'importation du CV: {e}")
        print(f"Erreur: {e}")
        return 1

def scrape_jobs(keywords, location, limit, sources, db_path):
    """Scrape les offres d'emploi."""
    try:
        print(f"Scraping des offres d'emploi pour: {keywords}")
        if location:
            print(f"Localisation: {location}")
        print(f"Limite: {limit} offres")
        print(f"Sources: {sources}")
        
        # Créer le scraper d'offres d'emploi
        job_scraper = JobScraper(db_path)
        
        # Convertir les sources en liste
        sources_list = sources.split(',')
        
        # Scraper les offres
        result = job_scraper.scrape_jobs(keywords, location, limit, sources_list)
        
        # Afficher le résultat
        print(f"Offres scrapées: {result['scraped_count']}")
        print(f"Nouvelles offres: {result['new_count']}")
        print(f"Offres mises à jour: {result['updated_count']}")
        
        # Fermer la connexion
        job_scraper.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors du scraping des offres d'emploi: {e}")
        print(f"Erreur: {e}")
        return 1

def calculate_transport(home, limit, db_path):
    """Calcule les temps de transport pour les offres d'emploi."""
    try:
        # Récupérer l'adresse du domicile
        home_location = home or os.getenv('HOME_LOCATION')
        if not home_location:
            logger.error("Adresse du domicile non spécifiée")
            print("Erreur: Adresse du domicile non spécifiée")
            print("Utilisez --home ou définissez HOME_LOCATION dans le fichier .env")
            return 1
            
        print(f"Calcul des temps de transport depuis: {home_location}")
        print(f"Limite: {limit} offres")
        
        # Créer le scraper de temps de transport
        transport_scraper = TransportScraper(db_path, home_location)
        
        # Calculer les temps de transport
        processed_count = transport_scraper.process_jobs_without_transport_data(limit)
        
        # Afficher le résultat
        print(f"Offres traitées: {processed_count}")
        
        # Fermer la connexion
        transport_scraper.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul des temps de transport: {e}")
        print(f"Erreur: {e}")
        return 1

def calculate_matching(job_id, limit, db_path):
    """Calcule les scores de matching pour les offres d'emploi."""
    try:
        # Récupérer l'URL d'Ollama
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        
        print(f"Calcul des scores de matching avec Ollama: {ollama_url}")
        
        # Créer le moteur de matching
        engine = MatchingEngine(db_path, ollama_url)
        
        # Calculer les scores
        if job_id:
            print(f"Calcul du score pour l'offre {job_id}")
            score = engine.calculate_job_match_score(job_id)
            print(f"Score de matching pour l'offre {job_id}: {score}")
        else:
            print(f"Calcul des scores pour toutes les offres (limite: {limit})")
            processed_count = engine.update_all_job_scores(limit)
            print(f"Offres traitées: {processed_count}")
        
        # Fermer la connexion
        engine.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul des scores de matching: {e}")
        print(f"Erreur: {e}")
        return 1

def generate_documents(job_id, cv_only, letter_only, db_path):
    """Génère des CV et lettres de motivation personnalisés."""
    try:
        # Récupérer l'URL d'Ollama
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        
        print(f"Génération de documents pour l'offre {job_id} avec Ollama: {ollama_url}")
        
        # Créer le générateur de contenu
        generator = ContentGenerator(db_path, ollama_url, "templates", "output")
        
        # Générer les documents
        if cv_only:
            print("Génération du CV uniquement")
            cv_path = generator.generate_cv(job_id)
            print(f"CV généré: {cv_path}")
        elif letter_only:
            print("Génération de la lettre de motivation uniquement")
            letter_path = generator.generate_cover_letter(job_id)
            print(f"Lettre de motivation générée: {letter_path}")
        else:
            print("Génération du CV et de la lettre de motivation")
            cv_path, letter_path = generator.generate_documents_for_job(job_id)
            print(f"CV généré: {cv_path}")
            print(f"Lettre de motivation générée: {letter_path}")
        
        # Fermer la connexion
        generator.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des documents: {e}")
        print(f"Erreur: {e}")
        return 1

def sync_nocodb(init, sync_all, sync_statuses, get_url, db_path):
    """Synchronise les données avec NocoDB."""
    try:
        # Récupérer les informations de NocoDB
        nocodb_url = os.getenv('NOCODB_URL')
        nocodb_auth_token = os.getenv('NOCODB_AUTH_TOKEN')
        
        if not nocodb_url or not nocodb_auth_token:
            logger.error("Informations de connexion NocoDB manquantes")
            print("Erreur: Informations de connexion NocoDB manquantes")
            print("Définissez NOCODB_URL et NOCODB_AUTH_TOKEN dans le fichier .env")
            return 1
            
        print(f"Synchronisation avec NocoDB: {nocodb_url}")
        
        # Créer l'intégration NocoDB
        integration = NocoDBIntegration(db_path, nocodb_url, nocodb_auth_token)
        
        # Exécuter les actions demandées
        if init:
            print("Initialisation de l'intégration NocoDB")
            if integration.initialize():
                print("Intégration initialisée avec succès")
            else:
                print("Échec de l'initialisation de l'intégration")
                return 1
                
        if sync_all:
            print("Synchronisation de toutes les offres avec NocoDB")
            synced_count = integration.sync_all_jobs()
            print(f"{synced_count} offres synchronisées avec NocoDB")
            
        if sync_statuses:
            print("Synchronisation des statuts depuis NocoDB")
            synced_count = integration.sync_job_statuses()
            print(f"{synced_count} statuts synchronisés depuis NocoDB")
            
        if get_url:
            url = integration.get_nocodb_url()
            print(f"URL de l'interface NocoDB: {url}")
            
        # Fermer la connexion
        integration.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors de la synchronisation avec NocoDB: {e}")
        print(f"Erreur: {e}")
        return 1

def filter_jobs(min_score, min_salary, max_travel, db_path):
    """Filtre les offres d'emploi selon des critères spécifiques."""
    try:
        # Récupérer l'URL d'Ollama
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        
        print(f"Filtrage des offres d'emploi")
        print(f"Score minimum: {min_score}")
        print(f"Salaire minimum: {min_salary}€")
        print(f"Temps de trajet maximum: {max_travel} minutes")
        
        # Créer le moteur de matching
        engine = MatchingEngine(db_path, ollama_url)
        
        # Filtrer les offres
        filtered_jobs = engine.filter_jobs_by_criteria(min_score, min_salary, max_travel)
        
        # Afficher le résultat
        print(f"{len(filtered_jobs)} offres correspondant aux critères:")
        
        # Récupérer les détails des offres filtrées
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        for job_id in filtered_jobs:
            cursor.execute("""
            SELECT j.title, c.name, j.location, j.matching_score, t.travel_time
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN transport_data t ON j.id = t.job_id AND t.travel_mode = 'public_transport'
            WHERE j.id = ?
            """, (job_id,))
            
            job = cursor.fetchone()
            if job:
                title, company, location, score, travel_time = job
                print(f"- ID: {job_id}, Score: {score}, Trajet: {travel_time} min")
                print(f"  {title} chez {company} ({location})")
                print()
        
        conn.close()
        
        # Fermer la connexion
        engine.close()
        
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors du filtrage des offres: {e}")
        print(f"Erreur: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
