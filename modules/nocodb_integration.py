#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module d'intégration avec NocoDB
Ce module permet d'intégrer l'application avec une instance NocoDB existante
pour la gestion des offres d'emploi en mode Kanban.
"""

import os
import json
import logging
import sqlite3
import requests
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NocoDBIntegration:
    """
    Classe pour intégrer l'application avec une instance NocoDB existante.
    """

    def __init__(self, db_path: str, nocodb_url: str, nocodb_auth_token: str):
        """
        Initialisation de l'intégration NocoDB.
        
        Args:
            db_path: Chemin vers la base de données SQLite
            nocodb_url: URL de l'instance NocoDB
            nocodb_auth_token: Token d'authentification NocoDB
        """
        self.db_path = db_path
        self.nocodb_url = nocodb_url.rstrip('/')
        self.nocodb_auth_token = nocodb_auth_token
        self.conn = None
        self.cursor = None
        self.project_id = None
        self.table_id = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Configuration des en-têtes pour les requêtes API
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "xc-auth": self.nocodb_auth_token
        }

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _get_project_id(self) -> str:
        """
        Récupère l'ID du projet NocoDB.
        
        Returns:
            ID du projet
        """
        try:
            # Récupérer la liste des projets
            response = requests.get(
                f"{self.nocodb_url}/api/v1/db/meta/projects",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la récupération des projets: {response.text}")
                return None
                
            projects = response.json()
            
            # Chercher le projet "JobSearch" ou créer un nouveau projet
            for project in projects:
                if project.get("title") == "JobSearch":
                    return project.get("id")
                    
            # Si le projet n'existe pas, le créer
            return self._create_project()
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'ID du projet: {e}")
            return None

    def _create_project(self) -> str:
        """
        Crée un nouveau projet NocoDB.
        
        Returns:
            ID du projet créé
        """
        try:
            # Créer un nouveau projet
            response = requests.post(
                f"{self.nocodb_url}/api/v1/db/meta/projects",
                headers=self.headers,
                json={
                    "title": "JobSearch",
                    "description": "Application de recherche d'emploi automatisée"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la création du projet: {response.text}")
                return None
                
            project = response.json()
            return project.get("id")
            
        except Exception as e:
            logger.error(f"Erreur lors de la création du projet: {e}")
            return None

    def _get_table_id(self, project_id: str, table_name: str) -> str:
        """
        Récupère l'ID d'une table NocoDB.
        
        Args:
            project_id: ID du projet
            table_name: Nom de la table
            
        Returns:
            ID de la table
        """
        try:
            # Récupérer la liste des tables
            response = requests.get(
                f"{self.nocodb_url}/api/v1/db/meta/projects/{project_id}/tables",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la récupération des tables: {response.text}")
                return None
                
            tables = response.json()
            
            # Chercher la table
            for table in tables:
                if table.get("title") == table_name:
                    return table.get("id")
                    
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'ID de la table: {e}")
            return None

    def _create_kanban_view(self, project_id: str, table_id: str) -> str:
        """
        Crée une vue Kanban pour une table.
        
        Args:
            project_id: ID du projet
            table_id: ID de la table
            
        Returns:
            ID de la vue Kanban
        """
        try:
            # Vérifier si la vue Kanban existe déjà
            response = requests.get(
                f"{self.nocodb_url}/api/v1/db/meta/tables/{table_id}/views",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la récupération des vues: {response.text}")
                return None
                
            views = response.json()
            
            # Chercher la vue Kanban
            for view in views:
                if view.get("type") == "kanban":
                    return view.get("id")
            
            # Créer une nouvelle vue Kanban
            response = requests.post(
                f"{self.nocodb_url}/api/v1/db/meta/tables/{table_id}/views",
                headers=self.headers,
                json={
                    "title": "Kanban",
                    "type": "kanban",
                    "show_system_fields": True,
                    "meta": {
                        "groupingField": "status",
                        "kanbanOptions": {
                            "groups": [
                                {"title": "Backlog", "color": "#E5E5E5"},
                                {"title": "To Be Reviewed", "color": "#FFCC00"},
                                {"title": "For Application", "color": "#00CCFF"},
                                {"title": "Applied", "color": "#00FF00"},
                                {"title": "Rejected by me", "color": "#FF9900"},
                                {"title": "Negative Answer", "color": "#FF0000"}
                            ]
                        }
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la création de la vue Kanban: {response.text}")
                return None
                
            view = response.json()
            return view.get("id")
            
        except Exception as e:
            logger.error(f"Erreur lors de la création de la vue Kanban: {e}")
            return None

    def _create_jobs_table(self, project_id: str) -> str:
        """
        Crée une table Jobs dans NocoDB.
        
        Args:
            project_id: ID du projet
            
        Returns:
            ID de la table créée
        """
        try:
            # Créer la table Jobs
            response = requests.post(
                f"{self.nocodb_url}/api/v1/db/meta/projects/{project_id}/tables",
                headers=self.headers,
                json={
                    "title": "Jobs",
                    "columns": [
                        {
                            "title": "id",
                            "column_name": "id",
                            "uidt": "ID",
                            "meta": {
                                "ai": True,
                                "pk": True
                            }
                        },
                        {
                            "title": "Title",
                            "column_name": "title",
                            "uidt": "SingleLineText",
                            "meta": {
                                "nullable": False
                            }
                        },
                        {
                            "title": "Company",
                            "column_name": "company",
                            "uidt": "SingleLineText"
                        },
                        {
                            "title": "Location",
                            "column_name": "location",
                            "uidt": "SingleLineText"
                        },
                        {
                            "title": "Description",
                            "column_name": "description",
                            "uidt": "LongText"
                        },
                        {
                            "title": "Salary",
                            "column_name": "salary",
                            "uidt": "SingleLineText"
                        },
                        {
                            "title": "URL",
                            "column_name": "url",
                            "uidt": "URL"
                        },
                        {
                            "title": "Source",
                            "column_name": "source",
                            "uidt": "SingleLineText"
                        },
                        {
                            "title": "Matching Score",
                            "column_name": "matching_score",
                            "uidt": "Number"
                        },
                        {
                            "title": "Travel Time",
                            "column_name": "travel_time",
                            "uidt": "Number"
                        },
                        {
                            "title": "Status",
                            "column_name": "status",
                            "uidt": "SingleSelect",
                            "meta": {
                                "options": [
                                    "Backlog",
                                    "To Be Reviewed",
                                    "For Application",
                                    "Applied",
                                    "Rejected by me",
                                    "Negative Answer"
                                ]
                            }
                        },
                        {
                            "title": "Date Posted",
                            "column_name": "date_posted",
                            "uidt": "Date"
                        },
                        {
                            "title": "Date Scraped",
                            "column_name": "date_scraped",
                            "uidt": "DateTime"
                        },
                        {
                            "title": "Skills",
                            "column_name": "skills",
                            "uidt": "MultiSelect",
                            "meta": {
                                "options": []
                            }
                        },
                        {
                            "title": "Notes",
                            "column_name": "notes",
                            "uidt": "LongText"
                        }
                    ]
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la création de la table Jobs: {response.text}")
                return None
                
            table = response.json()
            table_id = table.get("id")
            
            # Créer la vue Kanban
            self._create_kanban_view(project_id, table_id)
            
            return table_id
            
        except Exception as e:
            logger.error(f"Erreur lors de la création de la table Jobs: {e}")
            return None

    def _sync_job_to_nocodb(self, job_id: int) -> bool:
        """
        Synchronise une offre d'emploi avec NocoDB.
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            True si la synchronisation a réussi, False sinon
        """
        try:
            # Récupérer les détails de l'offre
            self.cursor.execute("""
            SELECT j.id, j.title, c.name as company, j.location, j.description,
                   j.salary_min, j.salary_max, j.url, j.source, j.matching_score,
                   t.travel_time, j.status, j.date_posted, j.date_scraped
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN transport_data t ON j.id = t.job_id AND t.travel_mode = 'public_transport'
            WHERE j.id = ?
            """, (job_id,))
            
            job_row = self.cursor.fetchone()
            if not job_row:
                logger.warning(f"Offre d'emploi {job_id} non trouvée")
                return False
                
            # Convertir en dictionnaire
            columns = [column[0] for column in self.cursor.description]
            job = dict(zip(columns, job_row))
            
            # Récupérer les compétences
            self.cursor.execute(
                "SELECT skill_name FROM job_skills WHERE job_id = ?",
                (job_id,)
            )
            skills = [row[0] for row in self.cursor.fetchall()]
            
            # Formater le salaire
            salary = ""
            if job.get("salary_min") and job.get("salary_max"):
                salary = f"{job.get('salary_min')}€ - {job.get('salary_max')}€"
            elif job.get("salary_min"):
                salary = f"{job.get('salary_min')}€+"
            elif job.get("salary_max"):
                salary = f"Jusqu'à {job.get('salary_max')}€"
                
            # Mapper le statut
            status_mapping = {
                "new": "Backlog",
                "reviewing": "To Be Reviewed",
                "to_apply": "For Application",
                "applied": "Applied",
                "rejected_by_me": "Rejected by me",
                "rejected_by_company": "Negative Answer"
            }
            status = status_mapping.get(job.get("status"), "Backlog")
            
            # Vérifier si l'offre existe déjà dans NocoDB
            response = requests.get(
                f"{self.nocodb_url}/api/v1/db/data/noco/{self.project_id}/Jobs/find-one",
                headers=self.headers,
                params={"where": f"(id,eq,{job_id})"}
            )
            
            if response.status_code == 200 and response.json():
                # Mettre à jour l'offre existante
                response = requests.patch(
                    f"{self.nocodb_url}/api/v1/db/data/noco/{self.project_id}/Jobs/{job_id}",
                    headers=self.headers,
                    json={
                        "title": job.get("title"),
                        "company": job.get("company"),
                        "location": job.get("location"),
                        "description": job.get("description"),
                        "salary": salary,
                        "url": job.get("url"),
                        "source": job.get("source"),
                        "matching_score": job.get("matching_score"),
                        "travel_time": job.get("travel_time"),
                        "status": status,
                        "date_posted": job.get("date_posted"),
                        "date_scraped": job.get("date_scraped"),
                        "skills": skills
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Offre d'emploi {job_id} mise à jour dans NocoDB")
                    return True
                else:
                    logger.error(f"Erreur lors de la mise à jour de l'offre {job_id}: {response.text}")
                    return False
            else:
                # Créer une nouvelle offre
                response = requests.post(
                    f"{self.nocodb_url}/api/v1/db/data/noco/{self.project_id}/Jobs",
                    headers=self.headers,
                    json={
                        "id": job_id,
                        "title": job.get("title"),
                        "company": job.get("company"),
                        "location": job.get("location"),
                        "description": job.get("description"),
                        "salary": salary,
                        "url": job.get("url"),
                        "source": job.get("source"),
                        "matching_score": job.get("matching_score"),
                        "travel_time": job.get("travel_time"),
                        "status": status,
                        "date_posted": job.get("date_posted"),
                        "date_scraped": job.get("date_scraped"),
                        "skills": skills
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Offre d'emploi {job_id} créée dans NocoDB")
                    return True
                else:
                    logger.error(f"Erreur lors de la création de l'offre {job_id}: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de la synchronisation de l'offre {job_id}: {e}")
            return False