#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de scraping d'offres d'emploi
Ce module utilise JobSpy pour scraper les offres d'emploi de différentes plateformes
et les stocker dans la base de données SQLite.
"""

import os
import json
import logging
import sqlite3
import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Bibliothèque JobSpy pour le scraping d'offres d'emploi
from jobspy import scrape_jobs
import pandas as pd

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def search_jobs(self, keywords: List[str], location: str, job_type: List[str], 
               is_remote: bool = False, skills: List[str] = None,
               date_posted: str = None, sort_by: str = 'relevance',
               page: int = 1, hours_old: int = 72) -> Dict[str, Any]:
    """Search jobs in database with filters"""
    try:
        query = """
        SELECT j.id, j.title, c.name as company_name, j.location, j.description,
               j.url, j.date_posted, j.salary_min, j.salary_max, j.salary_currency,
               j.matching_score, j.skills, j.job_type, j.experience_level, j.is_remote
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE 1=1
        """
        
        params = []
        conditions = []
        
        if keywords:
            conditions.append("(" + " OR ".join(["j.title LIKE ?" for _ in keywords]) + ")")
            params.extend([f"%{kw}%" for kw in keywords])
        
        if location:
            conditions.append("j.location LIKE ?")
            params.append(f"%{location}%")
            
        if job_type:
            conditions.append("j.job_type IN (" + ",".join(["?"]*len(job_type)) + ")")
            params.extend(job_type)
            
        if is_remote:
            conditions.append("j.is_remote = 1")
            
        if skills:
            conditions.append("(" + " OR ".join(["j.skills LIKE ?" for _ in skills]) + ")")
            params.extend([f"%{skill}%" for skill in skills])
            
        if date_posted:
            conditions.append("j.date_posted >= ?")
            params.append(date_posted)
        elif hours_old:
            conditions.append("j.date_posted >= datetime('now', ?)")
            params.append(f"-{hours_old} hours")
            
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        # Ajouter le tri
        if sort_by == 'date':
            query += " ORDER BY j.date_posted DESC"
        elif sort_by == 'salary':
            query += " ORDER BY j.salary_max DESC"
        else:  # relevance
            query += " ORDER BY j.matching_score DESC, j.date_posted DESC"
            
        # Ajouter la pagination
        query += " LIMIT 10 OFFSET ?"
        params.append((page - 1) * 10)
        
        self.cursor.execute(query, params)
        jobs = self.cursor.fetchall()
        
        # Convert to list of dicts
        job_list = []
        for job in jobs:
            salary = None
            if job[7] is not None and job[8] is not None:
                salary = f"{job[7]}-{job[8]} {job[9] or 'EUR'}"
                
            job_list.append({
                "id": str(job[0]),
                "title": job[1],
                "company_name": job[2],
                "location": job[3],
                "description": job[4],
                "url": job[5],
                "date_posted": job[6],
                "salary": salary,
                "matching_score": job[10],
                "skills": job[11] or [],
                "job_type": job[12],
                "experience_level": job[13],
                "is_remote": job[14]
            })
            
        return {
            "jobs": job_list,
            "stats": {
                "total": len(job_list),
                "new": 0,  # You'll need to implement new job detection
                "updated": 0  # And update detection
            }
        }
        
    except sqlite3.Error as e:
        logger.error(f"Database error during search: {e}")
        return {"jobs": [], "stats": {"total": 0, "new": 0, "updated": 0}}


class JobScraper:
    """
    Classe pour scraper les offres d'emploi de différentes plateformes
    et les stocker dans la base de données SQLite.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du scraper d'offres d'emploi.
        
        Args:
            db_path: Chemin vers la base de données SQLite
        """
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.supported_sites = ["linkedin", "indeed", "glassdoor", "google", "zip_recruiter", "bayt", "naukri"]
        
        # Connexion à la base de données
        self._connect_db()
        
        # Création des tables si elles n'existent pas
        self._create_tables_if_not_exist()

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _create_tables_if_not_exist(self) -> None:
        """Crée les tables nécessaires si elles n'existent pas."""
        try:
            # Table des entreprises
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                website TEXT,
                industry TEXT,
                size TEXT,
                linkedin_url TEXT,
                logo_path TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (name, website)
            )
            ''')
            
            # Table des offres d'emploi
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company_id INTEGER,
                description TEXT,
                location TEXT,
                job_type TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                salary_currency TEXT DEFAULT 'EUR',
                salary_period TEXT DEFAULT 'yearly',
                url TEXT NOT NULL,
                date_posted DATE,
                date_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT NOT NULL,
                raw_data TEXT,
                matching_score REAL,
                is_remote BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'new',
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
                UNIQUE (url, source)
            )
            ''')
            
            # Table des logs de scraping
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS scraping_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                status TEXT NOT NULL,
                jobs_found INTEGER DEFAULT 0,
                jobs_added INTEGER DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Table des compétences requises pour les offres
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                skill_name TEXT NOT NULL,
                is_required BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE (job_id, skill_name)
            )
            ''')
            
            self.conn.commit()
            logger.info("Tables créées avec succès")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des tables: {e}")
            raise

    def _get_or_create_company(self, company_name: str) -> int:
        """
        Récupère l'ID d'une entreprise ou la crée si elle n'existe pas.
        
        Args:
            company_name: Nom de l'entreprise
            
        Returns:
            ID de l'entreprise
        """
        try:
            # Vérifier si l'entreprise existe déjà
            self.cursor.execute("SELECT id FROM companies WHERE name = ?", (company_name,))
            result = self.cursor.fetchone()
            
            if result:
                return result[0]
            
            # Créer l'entreprise si elle n'existe pas
            self.cursor.execute(
                "INSERT INTO companies (name) VALUES (?)",
                (company_name,)
            )
            self.conn.commit()
            
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération/création de l'entreprise: {e}")
            self.conn.rollback()
            return None

    def _parse_salary(self, min_amount: Optional[float], max_amount: Optional[float], 
                     interval: Optional[str]) -> Tuple[Optional[int], Optional[int], str]:
        """
        Parse les informations de salaire.
        
        Args:
            min_amount: Montant minimum du salaire
            max_amount: Montant maximum du salaire
            interval: Intervalle de temps (yearly, monthly, hourly)
            
        Returns:
            Tuple (salaire_min, salaire_max, période)
        """
        # Valeurs par défaut
        salary_min = None
        salary_max = None
        period = "yearly"
        
        # Conversion des valeurs None en None explicite
        if min_amount == "None" or min_amount == "" or min_amount is None:
            min_amount = None
        if max_amount == "None" or max_amount == "" or max_amount is None:
            max_amount = None
            
        # Détermination de la période
        if interval:
            if interval.lower() == "yearly":
                period = "yearly"
            elif interval.lower() == "monthly":
                period = "monthly"
            elif interval.lower() == "hourly":
                period = "hourly"
                
        # Conversion des salaires horaires et mensuels en annuels
        if min_amount is not None:
            if period == "hourly":
                salary_min = int(float(min_amount) * 35 * 52)  # 35h/semaine, 52 semaines/an
            elif period == "monthly":
                salary_min = int(float(min_amount) * 12)  # 12 mois/an
            else:
                salary_min = int(float(min_amount))
                
        if max_amount is not None:
            if period == "hourly":
                salary_max = int(float(max_amount) * 35 * 52)
            elif period == "monthly":
                salary_max = int(float(max_amount) * 12)
            else:
                salary_max = int(float(max_amount))
                
        return salary_min, salary_max, period

    def _extract_job_type(self, job_type: Optional[str]) -> str:
        """
        Extrait le type de contrat standardisé.
        
        Args:
            job_type: Type de contrat brut
            
        Returns:
            Type de contrat standardisé
        """
        if not job_type:
            return None
            
        job_type = job_type.lower()
        
        if job_type == "fulltime":
            return "CDI"
        elif job_type == "parttime":
            return "temps partiel"
        elif job_type == "contract":
            return "CDD"
        elif job_type == "internship":
            return "stage"
        else:
            return job_type

    def _save_job_to_db(self, job: Dict[str, Any]) -> Optional[int]:
        """
        Sauvegarde une offre d'emploi dans la base de données.
        
        Args:
            job: Dictionnaire contenant les informations de l'offre
            
        Returns:
            ID de l'offre d'emploi ou None en cas d'erreur
        """
        try:
            # Récupérer ou créer l'entreprise
            company_id = self._get_or_create_company(job.get("COMPANY", "Entreprise inconnue"))
            
            # Parser les informations de salaire
            salary_min, salary_max, salary_period = self._parse_salary(
                job.get("MIN_AMOUNT"), 
                job.get("MAX_AMOUNT"),
                job.get("INTERVAL")
            )
            
            # Extraire le type de contrat standardisé
            job_type = self._extract_job_type(job.get("JOB_TYPE"))
            
            # Convertir la date de publication
            date_posted = None
            if "date_posted" in job and job["date_posted"]:
                try:
                    date_posted = datetime.datetime.strptime(job["date_posted"], "%Y-%m-%d").date()
                except ValueError:
                    logger.warning(f"Format de date invalide: {job['date_posted']}")
            
            # Insérer l'offre d'emploi
            self.cursor.execute('''
            INSERT OR IGNORE INTO jobs (
                title, company_id, location, job_type, 
                salary_min, salary_max, salary_currency, salary_period,
                url, date_posted, source, raw_data, is_remote
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job.get("TITLE", "Titre inconnu"),
                company_id,
                job.get("CITY", "") + (", " + job.get("STATE", "") if job.get("STATE") else ""),
                job_type,
                salary_min,
                salary_max,
                "EUR",  # Par défaut en euros
                salary_period,
                job.get("JOB_URL", ""),
                date_posted,
                job.get("SITE", "unknown"),
                json.dumps(job),
                1 if job.get("is_remote") else 0
            ))
            
            # Récupérer l'ID de l'offre insérée
            job_id = self.cursor.lastrowid
            
            # Si l'offre a été insérée (pas ignorée à cause de UNIQUE)
            if job_id:
                # Extraire et sauvegarder la description si disponible
                if "DESCRIPTION" in job and job["DESCRIPTION"]:
                    self.cursor.execute(
                        "UPDATE jobs SET description = ? WHERE id = ?",
                        (job["DESCRIPTION"], job_id)
                    )
                
                # Extraire et sauvegarder les compétences si disponible
                if "skills" in job and job["skills"]:
                    for skill in job["skills"]:
                        self.cursor.execute('''
                        INSERT OR IGNORE INTO job_skills (job_id, skill_name)
                        VALUES (?, ?)
                        ''', (job_id, skill))
            
            self.conn.commit()
            return job_id
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la sauvegarde de l'offre: {e}")
            self.conn.rollback()
            return None

    def _extract_skills_from_description(self, description: str) -> List[str]:
        """
        Extrait les compétences techniques à partir de la description de l'offre.
        
        Args:
            description: Description de l'offre
            
        Returns:
            Liste des compétences extraites
        """
        if not description:
            return []
            
        # Liste des compétences techniques courantes
        common_skills = [
            "python", "java", "javascript", "typescript", "c++", "c#", "php", "ruby", "go",
            "html", "css", "sql", "nosql", "react", "angular", "vue", "node.js",
            "django", "flask", "spring", "laravel", "docker", "kubernetes",
            "aws", "azure", "gcp", "linux", "windows", "macos", "git", "svn",
            "ci/cd", "jenkins", "travis", "github", "gitlab", "bitbucket",
            "agile", "scrum", "kanban", "jira", "confluence", "trello",
            "machine learning", "deep learning", "ai", "data science",
            "big data", "hadoop", "spark", "kafka", "elasticsearch",
            "mongodb", "mysql", "postgresql", "oracle", "sql server",
            "rest", "graphql", "soap", "microservices", "soa", "api"
        ]
        
        # Convertir la description en minuscules
        description_lower = description.lower()
        
        # Extraire les compétences
        found_skills = []
        for skill in common_skills:
            if skill in description_lower:
                found_skills.append(skill)
                
        return found_skills

    def _log_scraping_start(self, source: str) -> int:
        """
        Enregistre le début d'une opération de scraping.
        
        Args:
            source: Source des offres (linkedin, indeed, etc.)
            
        Returns:
            ID du log de scraping
        """
        try:
            self.cursor.execute('''
            INSERT INTO scraping_logs (source, start_time, status)
            VALUES (?, ?, ?)
            ''', (source, datetime.datetime.now(), "running"))
            
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'enregistrement du début du scraping: {e}")
            return None

    def _log_scraping_end(self, log_id: int, status: str, jobs_found: int, jobs_added: int, 
                         error_message: Optional[str] = None) -> None:
        """
        Enregistre la fin d'une opération de scraping.
        
        Args:
            log_id: ID du log de scraping
            status: Statut final (completed, failed)
            jobs_found: Nombre d'offres trouvées
            jobs_added: Nombre d'offres ajoutées
            error_message: Message d'erreur éventuel
        """
        try:
            self.cursor.execute('''
            UPDATE scraping_logs
            SET end_time = ?, status = ?, jobs_found = ?, jobs_added = ?, error_message = ?
            WHERE id = ?
            ''', (datetime.datetime.now(), status, jobs_found, jobs_added, error_message, log_id))
            
            self.conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'enregistrement de la fin du scraping: {e}")

    def scrape_jobs_from_sites(self, search_term: str, location: str, 
                              sites: Optional[List[str]] = None, 
                              results_wanted: int = 100,
                              job_type: Optional[str] = None,
                              is_remote: bool = False,
                              hours_old: int = 72) -> Tuple[int, int]:
        """
        Scrape les offres d'emploi des sites spécifiés.
        
        Args:
            search_term: Terme de recherche
            location: Localisation
            sites: Liste des sites à scraper (par défaut tous les sites supportés)
            results_wanted: Nombre de résultats
(Content truncated due to size limit. Use line ranges to read in chunks)
"""