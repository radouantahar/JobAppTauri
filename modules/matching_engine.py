#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de matching et scoring
Ce module permet de calculer un score de matching entre le profil de l'utilisateur
et les offres d'emploi en utilisant des embeddings et un LLM local.
"""

import os
import json
import logging
import sqlite3
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Bibliothèques pour les embeddings et la similarité
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Bibliothèque pour l'intégration avec Ollama
import requests

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MatchingEngine:
    """
    Classe pour calculer un score de matching entre le profil de l'utilisateur
    et les offres d'emploi en utilisant des embeddings et un LLM local.
    """

    def __init__(self, db_path: str, ollama_url: str = "http://localhost:11434"):
        """
        Initialisation du moteur de matching.
        
        Args:
            db_path: Chemin vers la base de données SQLite
            ollama_url: URL de l'API Ollama
        """
        self.db_path = db_path
        self.ollama_url = ollama_url
        self.conn = None
        self.cursor = None
        self.model = None
        self.user_profile = None
        self.user_skills = None
        self.user_experiences = None
        self.user_education = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Chargement du modèle d'embeddings
        self._load_embedding_model()
        
        # Chargement du profil utilisateur
        self._load_user_profile()

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _load_embedding_model(self) -> None:
        """Charge le modèle d'embeddings."""
        try:
            # Utiliser un modèle multilingue qui supporte le français
            model_name = "paraphrase-multilingual-mpnet-base-v2"
            self.model = SentenceTransformer(model_name)
            logger.info(f"Modèle d'embeddings {model_name} chargé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle d'embeddings: {e}")
            raise

    def _load_user_profile(self) -> None:
        """Charge le profil de l'utilisateur depuis la base de données."""
        try:
            # Charger le profil principal
            self.cursor.execute("SELECT * FROM user_profile LIMIT 1")
            profile = self.cursor.fetchone()
            
            if not profile:
                logger.warning("Aucun profil utilisateur trouvé dans la base de données")
                return
                
            # Convertir en dictionnaire
            columns = [column[0] for column in self.cursor.description]
            self.user_profile = dict(zip(columns, profile))
            
            # Charger les compétences
            self.cursor.execute("SELECT * FROM user_skills WHERE user_id = ?", (self.user_profile["id"],))
            skills_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            self.user_skills = [dict(zip(columns, row)) for row in skills_rows]
            
            # Charger les expériences
            self.cursor.execute("SELECT * FROM user_experiences WHERE user_id = ?", (self.user_profile["id"],))
            exp_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            self.user_experiences = [dict(zip(columns, row)) for row in exp_rows]
            
            # Charger les formations
            self.cursor.execute("SELECT * FROM user_education WHERE user_id = ?", (self.user_profile["id"],))
            edu_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            self.user_education = [dict(zip(columns, row)) for row in edu_rows]
            
            logger.info(f"Profil utilisateur chargé: {len(self.user_skills)} compétences, {len(self.user_experiences)} expériences, {len(self.user_education)} formations")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors du chargement du profil utilisateur: {e}")
            raise

    def _get_user_profile_text(self) -> str:
        """
        Génère un texte représentant le profil de l'utilisateur.
        
        Returns:
            Texte du profil utilisateur
        """
        if not self.user_profile:
            logger.warning("Aucun profil utilisateur disponible")
            return ""
            
        profile_text = f"Profil de {self.user_profile.get('name', 'l\'utilisateur')}:\n\n"
        
        # Ajouter les compétences
        if self.user_skills:
            profile_text += "Compétences:\n"
            for skill in self.user_skills:
                level = f" ({skill.get('skill_level', '')})" if skill.get('skill_level') else ""
                profile_text += f"- {skill.get('skill_name', '')}{level}\n"
            profile_text += "\n"
            
        # Ajouter les expériences
        if self.user_experiences:
            profile_text += "Expériences professionnelles:\n"
            for exp in self.user_experiences:
                company = exp.get('company_name', '')
                position = exp.get('position', '')
                start = exp.get('start_date', '')
                end = exp.get('end_date', 'présent')
                description = exp.get('description', '')
                
                profile_text += f"- {position} chez {company} ({start} - {end})\n"
                if description:
                    profile_text += f"  {description}\n"
            profile_text += "\n"
            
        # Ajouter les formations
        if self.user_education:
            profile_text += "Formation:\n"
            for edu in self.user_education:
                institution = edu.get('institution', '')
                degree = edu.get('degree', '')
                field = edu.get('field', '')
                start = edu.get('start_date', '')
                end = edu.get('end_date', '')
                
                profile_text += f"- {degree} en {field} à {institution} ({start} - {end})\n"
            profile_text += "\n"
            
        return profile_text

    def _get_job_text(self, job: Dict[str, Any]) -> str:
        """
        Génère un texte représentant une offre d'emploi.
        
        Args:
            job: Dictionnaire contenant les informations de l'offre
            
        Returns:
            Texte de l'offre d'emploi
        """
        job_text = f"Offre d'emploi: {job.get('title', '')}\n\n"
        
        # Ajouter l'entreprise
        company = job.get('company_name', '')
        if company:
            job_text += f"Entreprise: {company}\n"
            
        # Ajouter la localisation
        location = job.get('location', '')
        if location:
            job_text += f"Localisation: {location}\n"
            
        # Ajouter le type de contrat
        job_type = job.get('job_type', '')
        if job_type:
            job_text += f"Type de contrat: {job_type}\n"
            
        # Ajouter le salaire
        salary_min = job.get('salary_min')
        salary_max = job.get('salary_max')
        if salary_min or salary_max:
            salary_text = "Salaire: "
            if salary_min:
                salary_text += f"{salary_min}€"
            if salary_min and salary_max:
                salary_text += f" - {salary_max}€"
            elif salary_max:
                salary_text += f"{salary_max}€"
            job_text += f"{salary_text} par an\n"
            
        # Ajouter la description
        description = job.get('description', '')
        if description:
            job_text += f"\nDescription:\n{description}\n"
            
        # Ajouter les compétences requises
        skills = job.get('skills', [])
        if skills:
            job_text += "\nCompétences requises:\n"
            for skill in skills:
                job_text += f"- {skill}\n"
                
        return job_text

    def _calculate_embedding_similarity(self, profile_text: str, job_text: str) -> float:
        """
        Calcule la similarité entre le profil et l'offre d'emploi en utilisant des embeddings.
        
        Args:
            profile_text: Texte du profil utilisateur
            job_text: Texte de l'offre d'emploi
            
        Returns:
            Score de similarité entre 0 et 1
        """
        try:
            # Générer les embeddings
            profile_embedding = self.model.encode([profile_text])[0]
            job_embedding = self.model.encode([job_text])[0]
            
            # Calculer la similarité cosinus
            similarity = cosine_similarity([profile_embedding], [job_embedding])[0][0]
            
            # Normaliser entre 0 et 1
            similarity = max(0, min(1, similarity))
            
            return similarity
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de la similarité par embeddings: {e}")
            return 0.0

    def _calculate_skill_match_score(self, job_skills: List[str]) -> float:
        """
        Calcule un score basé sur la correspondance des compétences.
        
        Args:
            job_skills: Liste des compétences requises pour l'offre
            
        Returns:
            Score de correspondance des compétences entre 0 et 1
        """
        if not job_skills or not self.user_skills:
            return 0.0
            
        # Extraire les noms de compétences de l'utilisateur
        user_skill_names = [skill.get('skill_name', '').lower() for skill in self.user_skills]
        
        # Compter les correspondances
        matches = 0
        for job_skill in job_skills:
            job_skill_lower = job_skill.lower()
            for user_skill in user_skill_names:
                # Vérifier si la compétence de l'offre est dans les compétences de l'utilisateur
                if job_skill_lower in user_skill or user_skill in job_skill_lower:
                    matches += 1
                    break
                    
        # Calculer le score
        if len(job_skills) > 0:
            return matches / len(job_skills)
        else:
            return 0.0

    def _calculate_experience_match_score(self, job_title: str) -> float:
        """
        Calcule un score basé sur la correspondance des expériences.
        
        Args:
            job_title: Titre du poste de l'offre
            
        Returns:
            Score de correspondance des expériences entre 0 et 1
        """
        if not job_title or not self.user_experiences:
            return 0.0
            
        job_title_lower = job_title.lower()
        
        # Vérifier si le titre du poste correspond à une expérience passée
        for exp in self.user_experiences:
            position = exp.get('position', '').lower()
            
            # Vérifier la correspondance
            if position in job_title_lower or job_title_lower in position:
                return 1.0
                
        return 0.0

    def _calculate_llm_match_score(self, profile_text: str, job_text: str) -> float:
        """
        Calcule un score de matching en utilisant un LLM local via Ollama.
        
        Args:
            profile_text: Texte du profil utilisateur
            job_text: Texte de l'offre d'emploi
            
        Returns:
            Score de matching entre 0 et 1
        """
        try:
            # Construire le prompt
            prompt = f"""
            Tu es un expert en recrutement qui évalue la compatibilité entre un candidat et une offre d'emploi.
            
            Voici le profil du candidat:
            {profile_text}
            
            Voici l'offre d'emploi:
            {job_text}
            
            Sur une échelle de 0 à 100, évalue la compatibilité entre le candidat et l'offre d'emploi.
            Prends en compte les compétences, l'expérience, la formation et les autres critères pertinents.
            Réponds uniquement avec un nombre entier entre 0 et 100.
            """
            
            # Appeler l'API Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "llama3:8b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 10
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de l'appel à Ollama: {response.text}")
                return 0.0
                
            # Extraire le score
            result = response.json()
            response_text = result.get("response", "0").strip()
            
            # Extraire le nombre du texte
            import re
            match = re.search(r'\b(\d+)\b', response_text)
            if match:
                score = int(match.group(1))
                # Normaliser entre 0 et 1
                return score / 100
            else:
                logger.warning(f"Impossible d'extraire un score numérique de la réponse: {response_text}")
                return 0.0
                
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score via LLM: {e}")
            return 0.0

    def calculate_job_match_score(self, job_id: int) -> float:
        """
        Calcule un score global de matching pour une offre d'emploi.
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            Score de matching entre 0 et 100
        """
        try:
            # Récupérer les informations de l'offre
            self.cursor.execute("""
            SELECT j.*, c.name as company_name
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.id = ?
            """, (job_id,))
            
            job_row = self.cursor.fetchone()
            if not job_row:
                logger.warning(f"Offre d'emploi {job_id} non trouvée")
                return 0.0
                
            # Convertir en dictionnaire
            columns = [column[0] for column in self.cursor.description]
            job = dict(zip(columns, job_row))
            
            # Récupérer les compétences de l'offre
            self.cursor.execute(
                "SELECT skill_name FROM job_skills WHERE job_id = ?",
                (job_id,)
            )
            job["skills"] = [row[0] for row in self.cursor.fetchall()]
            
            # Générer les textes
            profile_text = self._get_user_profile_text()
            job_text = self._get_job_text(job)
            
            # Calculer les différents scores
            embedding_score = self._calculate_embedding_similarity(profile_text, job_text)
            skill_score = self._calculate_skill_match_score(job["skills"])
            experience_score = self._calculate_experience_match_score(job["title"])
            
            # Calculer le score LLM si possible
            llm_score = 0.0
            try:
                llm_score = self._calculate_llm_match_score(profile_text, job_text)
            except Exception as e:
                logger.error(f"Erreur lors du calcul du score LLM: {e}")
                llm_score = 0.0
            
            # Calculer le score final
            final_score = (embedding_score * 0.4 + skill_score * 0.3 + 
                         experience_score * 0.2 + llm_score * 0.1)
            
            return final_score * 100
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score de matching: {e}")
            return 0.0