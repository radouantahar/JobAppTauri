#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de génération de contenu (CV et lettre de motivation)
Ce module permet de générer des CV et lettres de motivation personnalisés
en utilisant un LLM local via Ollama.
"""

import os
import json
import logging
import sqlite3
import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Bibliothèques pour l'intégration avec Ollama
import requests

# Bibliothèques pour la génération de documents
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ContentGenerator:
    """
    Classe pour générer des CV et lettres de motivation personnalisés
    en utilisant un LLM local via Ollama.
    """

    def __init__(self, db_path: str, ollama_url: str = "http://localhost:11434",
                templates_dir: str = "templates", output_dir: str = "output"):
        """
        Initialisation du générateur de contenu.
        
        Args:
            db_path: Chemin vers la base de données SQLite
            ollama_url: URL de l'API Ollama
            templates_dir: Répertoire contenant les templates de prompts
            output_dir: Répertoire de sortie pour les documents générés
        """
        self.db_path = db_path
        self.ollama_url = ollama_url
        self.templates_dir = Path(templates_dir)
        self.output_dir = Path(output_dir)
        self.conn = None
        self.cursor = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Création des répertoires si nécessaire
        os.makedirs(self.templates_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Création des templates par défaut s'ils n'existent pas
        self._create_default_templates()

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _create_default_templates(self) -> None:
        """Crée les templates de prompts par défaut s'ils n'existent pas."""
        # Template pour la lettre de motivation
        cover_letter_template_path = self.templates_dir / "cover_letter_prompt.txt"
        if not cover_letter_template_path.exists():
            cover_letter_template = """
Tu es un expert en rédaction de lettres de motivation professionnelles. Tu dois rédiger une lettre de motivation personnalisée pour le poste suivant, en te basant sur le profil du candidat.

Informations sur le poste:
Titre: {{job_title}}
Entreprise: {{company_name}}
Description: {{job_description}}

Profil du candidat:
Nom: {{candidate_name}}
Expérience: {{candidate_experience}}
Compétences: {{candidate_skills}}
Formation: {{candidate_education}}

Consignes:
1. Rédige une lettre de motivation formelle et professionnelle en français.
2. Adapte le contenu spécifiquement au poste et à l'entreprise mentionnés.
3. Mets en valeur les compétences et expériences du candidat qui correspondent aux exigences du poste.
4. Structure la lettre avec: introduction, corps (2-3 paragraphes), conclusion.
5. Utilise un ton professionnel mais engageant.
6. Limite la lettre à environ 350-400 mots.
7. Inclus les formules de politesse appropriées au début et à la fin.
8. N'invente pas d'informations qui ne sont pas fournies dans le profil du candidat.

Lettre de motivation:
"""
            with open(cover_letter_template_path, "w", encoding="utf-8") as f:
                f.write(cover_letter_template)
            logger.info(f"Template de lettre de motivation créé: {cover_letter_template_path}")
            
        # Template pour le CV
        cv_template_path = self.templates_dir / "cv_prompt.txt"
        if not cv_template_path.exists():
            cv_template = """
Tu es un expert en rédaction de CV professionnels. Tu dois améliorer et personnaliser le CV du candidat pour le poste suivant.

Informations sur le poste:
Titre: {{job_title}}
Entreprise: {{company_name}}
Description: {{job_description}}
Compétences requises: {{job_skills}}

Profil actuel du candidat:
Nom: {{candidate_name}}
Expérience: {{candidate_experience}}
Compétences: {{candidate_skills}}
Formation: {{candidate_education}}
Langues: {{candidate_languages}}

Consignes:
1. Analyse les informations du poste et du profil du candidat.
2. Propose une version améliorée et personnalisée du CV pour ce poste spécifique.
3. Mets en avant les expériences et compétences les plus pertinentes pour le poste.
4. Suggère des modifications dans la présentation des expériences pour mieux correspondre aux attentes.
5. Propose une section "Profil" ou "Résumé" percutante en début de CV.
6. Organise les compétences par catégories pertinentes pour le poste.
7. Suggère un ordre de présentation optimal des sections.
8. N'invente pas d'informations qui ne sont pas fournies dans le profil du candidat.

Format de réponse:
Fournis le contenu du CV sous forme de sections clairement délimitées (PROFIL, EXPÉRIENCE, FORMATION, COMPÉTENCES, LANGUES).
Pour chaque section, fournis le contenu formaté prêt à être intégré dans un document Word.

CV personnalisé:
"""
            with open(cv_template_path, "w", encoding="utf-8") as f:
                f.write(cv_template)
            logger.info(f"Template de CV créé: {cv_template_path}")

    def _get_user_profile(self) -> Dict[str, Any]:
        """
        Récupère le profil de l'utilisateur depuis la base de données.
        
        Returns:
            Dictionnaire contenant le profil de l'utilisateur
        """
        try:
            # Récupérer le profil principal
            self.cursor.execute("SELECT * FROM user_profile LIMIT 1")
            profile_row = self.cursor.fetchone()
            
            if not profile_row:
                logger.warning("Aucun profil utilisateur trouvé dans la base de données")
                return {}
                
            # Convertir en dictionnaire
            columns = [column[0] for column in self.cursor.description]
            profile = dict(zip(columns, profile_row))
            
            # Récupérer les compétences
            self.cursor.execute("SELECT * FROM user_skills WHERE user_id = ?", (profile["id"],))
            skills_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            skills = [dict(zip(columns, row)) for row in skills_rows]
            
            # Récupérer les expériences
            self.cursor.execute("SELECT * FROM user_experiences WHERE user_id = ? ORDER BY start_date DESC", (profile["id"],))
            exp_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            experiences = [dict(zip(columns, row)) for row in exp_rows]
            
            # Récupérer les formations
            self.cursor.execute("SELECT * FROM user_education WHERE user_id = ? ORDER BY end_date DESC", (profile["id"],))
            edu_rows = self.cursor.fetchall()
            columns = [column[0] for column in self.cursor.description]
            education = [dict(zip(columns, row)) for row in edu_rows]
            
            # Récupérer les langues (si disponibles)
            languages = []
            try:
                self.cursor.execute("SELECT * FROM user_languages WHERE user_id = ?", (profile["id"],))
                lang_rows = self.cursor.fetchall()
                if lang_rows:
                    columns = [column[0] for column in self.cursor.description]
                    languages = [dict(zip(columns, row)) for row in lang_rows]
            except sqlite3.Error:
                # La table des langues peut ne pas exister
                pass
                
            # Construire le profil complet
            user_profile = {
                "profile": profile,
                "skills": skills,
                "experiences": experiences,
                "education": education,
                "languages": languages
            }
            
            return user_profile
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération du profil utilisateur: {e}")
            return {}

    def _get_job_details(self, job_id: int) -> Dict[str, Any]:
        """
        Récupère les détails d'une offre d'emploi.
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            Dictionnaire contenant les détails de l'offre
        """
        try:
            # Récupérer l'offre d'emploi
            self.cursor.execute("""
            SELECT j.*, c.name as company_name
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.id = ?
            """, (job_id,))
            
            job_row = self.cursor.fetchone()
            if not job_row:
                logger.warning(f"Offre d'emploi {job_id} non trouvée")
                return {}
                
            # Convertir en dictionnaire
            columns = [column[0] for column in self.cursor.description]
            job = dict(zip(columns, job_row))
            
            # Récupérer les compétences de l'offre
            self.cursor.execute(
                "SELECT skill_name FROM job_skills WHERE job_id = ?",
                (job_id,)
            )
            job["skills"] = [row[0] for row in self.cursor.fetchall()]
            
            return job
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des détails de l'offre: {e}")
            return {}

    def _format_user_profile_for_prompt(self, user_profile: Dict[str, Any]) -> Dict[str, str]:
        """
        Formate le profil utilisateur pour les prompts.
        
        Args:
            user_profile: Profil utilisateur complet
            
        Returns:
            Dictionnaire avec les champs formatés pour les prompts
        """
        # Nom du candidat
        candidate_name = user_profile.get("profile", {}).get("name", "")
        
        # Expériences
        experiences = user_profile.get("experiences", [])
        experience_text = ""
        for exp in experiences:
            company = exp.get("company_name", "")
            position = exp.get("position", "")
            start_date = exp.get("start_date", "")
            end_date = exp.get("end_date", "présent")
            description = exp.get("description", "")
            
            experience_text += f"- {position} chez {company} ({start_date} - {end_date})\n"
            if description:
                experience_text += f"  {description}\n"
        
        # Compétences
        skills = user_profile.get("skills", [])
        skills_text = ", ".join([skill.get("skill_name", "") for skill in skills])
        
        # Formation
        education = user_profile.get("education", [])
        education_text = ""
        for edu in education:
            institution = edu.get("institution", "")
            degree = edu.get("degree", "")
            field = edu.get("field", "")
            start_date = edu.get("start_date", "")
            end_date = edu.get("end_date", "")
            
            education_text += f"- {degree} en {field} à {institution} ({start_date} - {end_date})\n"
        
        # Langues
        languages = user_profile.get("languages", [])
        languages_text = ", ".join([f"{lang.get('name', '')} ({lang.get('level', '')})" for lang in languages])
        
        return {
            "candidate_name": candidate_name,
            "candidate_experience": experience_text,
            "candidate_skills": skills_text,
            "candidate_education": education_text,
            "candidate_languages": languages_text
        }

    def _format_job_for_prompt(self, job: Dict[str, Any]) -> Dict[str, str]:
        """
        Formate les détails de l'offre pour les prompts.
        
        Args:
            job: Détails de l'offre d'emploi
            
        Returns:
            Dictionnaire avec les champs formatés pour les prompts
        """
        # Titre du poste
        job_title = job.get("title", "")
        
        # Nom de l'entreprise
        company_name = job.get("company_name", "")
        
        # Description
        job_description = job.get("description", "")
        
        # Compétences requises
        job_skills = ", ".join(job.get("skills", []))
        
        return {
            "job_title": job_title,
            "company_name": company_name,
            "job_description": job_description,
            "job_skills": job_skills
        }

    def _fill_template(self, template_path: str, data: Dict[str, str]) -> str:
        """
        Remplit un template avec les données fournies.
        
        Args:
            template_path: Chemin vers le fichier template
            data: Dictionnaire contenant les données à insérer
            
        Returns:
            Template rempli
        """
        try:
            # Lire le template
            with open(template_path, "r", encoding="utf-8") as f:
                template = f.read()
                
            # Remplacer les variables
            for key, value in data.items():
                placeholder = "{{" + key + "}}"
                template = template.replace(placeholder, value)
                
            return template
            
        except Exception as e:
            logger.error(f"Erreur lors du remplissage du template: {e}")
            return ""

    def _generate_text_with_ollama(self, prompt: str, model: str = "llama3:8b") -> str:
        """
        Génère du texte en utilisant Ollama.
        
        Args:
            prompt: Prompt à envoyer à Ollama
            model: Modèle à utiliser
            
        Returns:
            Texte généré
        """
        try:
            # Appeler l'API Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 2048
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de l'appel à Ollama: {response.text}")
                return ""
                
            # Extraire le texte généré
            result = response.json()
            generated_text = result.get("response", "").strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de texte avec Ollama: {e}")
            return ""

    def _create_cover_letter_docx(self, content: str, job: Dict[str, Any], 
                                user_profile: Dict[str, Any], output_path: str) -> None:
        """
        Crée un document Word pour la lettre de motivation.
        
        Args:
            content: Contenu de la lettre de motivation
            job: Détails de l'offre d'emploi
            user_profile: Profil de l'utilisateur
            output_path: Chemin de sortie pour le document
        """
        try:
            # Créer un nouveau document
            doc = Document()
            
            # Configurer les marges
            sections = doc.sections
            for section in sections:
                section.top_margin = Cm(2.5)
                section.bottom_margin = Cm(2.5)
                section.left_margin = Cm(2.5)
                section.right_margin = Cm(2.5)
                
            # Ajouter le contenu
            doc.add_paragraph(content)
            
            # Sauvegarder le document
            doc.save(output_path)
            
        except Exception as e:
            logger.error(f"Erreur lors de la création du document Word: {e}")
            raise