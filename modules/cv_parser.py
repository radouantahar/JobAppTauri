#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de parsing de CV (PDF)
Ce module permet d'extraire les informations d'un CV au format PDF
et de les structurer pour les stocker dans la base de données.
"""

import os
import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

# Bibliothèques pour l'extraction de texte des PDF
import pdfminer
from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams

# Bibliothèques pour le traitement du texte
import spacy
from spacy.matcher import Matcher
from spacy.tokens import Doc, Span

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chargement du modèle spaCy pour le français
try:
    nlp = spacy.load("fr_core_news_md")
    logger.info("Modèle spaCy fr_core_news_md chargé avec succès")
except OSError:
    logger.warning("Modèle spaCy fr_core_news_md non trouvé, installation en cours...")
    os.system("python -m spacy download fr_core_news_md")
    nlp = spacy.load("fr_core_news_md")
    logger.info("Modèle spaCy fr_core_news_md installé et chargé avec succès")


class CVParser:
    """
    Classe pour extraire et structurer les informations d'un CV au format PDF.
    """

    def __init__(self):
        """Initialisation du parser de CV."""
        self.sections = {
            "contact": ["contact", "coordonnées", "informations personnelles"],
            "summary": ["résumé", "profil", "à propos", "présentation", "sommaire"],
            "experience": ["expérience", "expériences", "parcours professionnel", "emplois"],
            "education": ["formation", "formations", "éducation", "études", "diplômes"],
            "skills": ["compétences", "savoir-faire", "expertises", "technologies"],
            "languages": ["langues", "compétences linguistiques"],
            "projects": ["projets", "réalisations", "portfolio"],
            "certifications": ["certifications", "certificats", "accréditations"],
            "interests": ["centres d'intérêt", "loisirs", "intérêts", "hobbies"]
        }
        
        # Initialisation des matchers spaCy
        self.matcher = Matcher(nlp.vocab)
        self._setup_matchers()

    def _setup_matchers(self):
        """Configure les patterns pour la détection des sections et des informations."""
        # Pattern pour les sections
        for section, keywords in self.sections.items():
            for keyword in keywords:
                # Match les titres de section (en majuscules, gras, etc.)
                self.matcher.add(f"section_{section}", [[{"LOWER": keyword.lower()}]])
                self.matcher.add(f"section_{section}_upper", [[{"LOWER": keyword.upper()}]])
                
        # Pattern pour les dates (format: MM/YYYY ou MM-YYYY)
        date_pattern = [
            {"SHAPE": "dd/dddd"},  # 01/2020
            {"SHAPE": "dd-dddd"}   # 01-2020
        ]
        self.matcher.add("DATE", [date_pattern])
        
        # Pattern pour les emails
        email_pattern = [{"TEXT": {"REGEX": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"}}]
        self.matcher.add("EMAIL", [email_pattern])
        
        # Pattern pour les numéros de téléphone
        phone_pattern = [{"TEXT": {"REGEX": r"(\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}"}}]
        self.matcher.add("PHONE", [phone_pattern])

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extrait le texte d'un fichier PDF.
        
        Args:
            pdf_path: Chemin vers le fichier PDF
            
        Returns:
            Le texte extrait du PDF
        """
        try:
            laparams = LAParams(
                line_margin=0.5,
                word_margin=0.1,
                char_margin=2.0,
                all_texts=True
            )
            text = extract_text(pdf_path, laparams=laparams)
            logger.info(f"Texte extrait du PDF: {len(text)} caractères")
            return text
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte du PDF: {e}")
            return ""

    def _identify_sections(self, doc: Doc) -> Dict[str, List[int]]:
        """
        Identifie les différentes sections du CV.
        
        Args:
            doc: Document spaCy
            
        Returns:
            Dictionnaire avec les sections identifiées et leurs positions
        """
        sections = {}
        matches = self.matcher(doc)
        
        for match_id, start, end in matches:
            rule_id = nlp.vocab.strings[match_id]
            if rule_id.startswith("section_"):
                section_type = rule_id.split("_")[1]
                if section_type not in sections:
                    sections[section_type] = []
                sections[section_type].append(start)
        
        # Trier les positions pour chaque section
        for section in sections:
            sections[section] = sorted(sections[section])
            
        return sections

    def _extract_section_text(self, doc: Doc, sections: Dict[str, List[int]]) -> Dict[str, str]:
        """
        Extrait le texte de chaque section identifiée.
        
        Args:
            doc: Document spaCy
            sections: Dictionnaire des sections et leurs positions
            
        Returns:
            Dictionnaire avec le texte de chaque section
        """
        section_texts = {}
        section_list = [(k, v[0]) for k, v in sections.items() if v]
        section_list.sort(key=lambda x: x[1])
        
        for i, (section, start) in enumerate(section_list):
            # Déterminer la fin de la section
            if i < len(section_list) - 1:
                end = section_list[i + 1][1]
            else:
                end = len(doc)
                
            # Extraire le texte de la section
            section_text = doc[start:end].text.strip()
            section_texts[section] = section_text
            
        return section_texts

    def _extract_contact_info(self, doc: Doc) -> Dict[str, str]:
        """
        Extrait les informations de contact (email, téléphone, etc.).
        
        Args:
            doc: Document spaCy
            
        Returns:
            Dictionnaire avec les informations de contact
        """
        contact_info = {
            "email": None,
            "phone": None,
            "address": None,
            "linkedin": None
        }
        
        # Recherche d'email
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        emails = re.findall(email_pattern, doc.text)
        if emails:
            contact_info["email"] = emails[0]
            
        # Recherche de numéro de téléphone
        phone_pattern = r"(\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}"
        phones = re.findall(phone_pattern, doc.text)
        if phones:
            contact_info["phone"] = phones[0]
            
        # Recherche de profil LinkedIn
        linkedin_pattern = r"linkedin\.com\/in\/[a-zA-Z0-9_-]+"
        linkedin = re.findall(linkedin_pattern, doc.text)
        if linkedin:
            contact_info["linkedin"] = linkedin[0]
            
        return contact_info

    def _extract_experiences(self, section_text: str) -> List[Dict[str, str]]:
        """
        Extrait les expériences professionnelles.
        
        Args:
            section_text: Texte de la section expériences
            
        Returns:
            Liste des expériences professionnelles
        """
        experiences = []
        
        # Traitement du texte avec spaCy
        doc = nlp(section_text)
        
        # Recherche de dates
        date_pattern = r"((?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+\d{4})"
        dates = re.findall(date_pattern, section_text, re.IGNORECASE)
        
        # Recherche de titres de poste courants
        job_titles = [
            "développeur", "ingénieur", "chef de projet", "directeur", "consultant",
            "analyste", "architecte", "responsable", "manager", "technicien"
        ]
        
        # Extraction des expériences
        experience_blocks = re.split(r"\n\s*\n", section_text)
        for block in experience_blocks:
            if not block.strip():
                continue
                
            experience = {
                "company": None,
                "position": None,
                "start_date": None,
                "end_date": None,
                "description": block.strip()
            }
            
            # Recherche de l'entreprise (souvent en majuscules)
            company_match = re.search(r"([A-Z][A-Z\s]+)", block)
            if company_match:
                experience["company"] = company_match.group(1).strip()
                
            # Recherche du titre de poste
            for title in job_titles:
                if re.search(title, block, re.IGNORECASE):
                    position_match = re.search(r"((?:" + title + r")[^,\n]*)", block, re.IGNORECASE)
                    if position_match:
                        experience["position"] = position_match.group(1).strip()
                        break
                        
            # Recherche des dates
            dates_in_block = re.findall(date_pattern, block, re.IGNORECASE)
            if len(dates_in_block) >= 2:
                experience["start_date"] = dates_in_block[0]
                experience["end_date"] = dates_in_block[1]
            elif len(dates_in_block) == 1:
                experience["start_date"] = dates_in_block[0]
                if "présent" in block.lower() or "actuel" in block.lower():
                    experience["end_date"] = "Présent"
                    
            experiences.append(experience)
            
        return experiences

    def _extract_education(self, section_text: str) -> List[Dict[str, str]]:
        """
        Extrait les formations.
        
        Args:
            section_text: Texte de la section formation
            
        Returns:
            Liste des formations
        """
        education = []
        
        # Traitement du texte avec spaCy
        doc = nlp(section_text)
        
        # Recherche de dates
        date_pattern = r"((?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+\d{4}|\d{4})"
        
        # Recherche de diplômes courants
        degree_keywords = [
            "master", "licence", "bac", "doctorat", "diplôme", "ingénieur",
            "bts", "dut", "mba", "certificat", "formation"
        ]
        
        # Extraction des formations
        education_blocks = re.split(r"\n\s*\n", section_text)
        for block in education_blocks:
            if not block.strip():
                continue
                
            edu = {
                "institution": None,
                "degree": None,
                "field": None,
                "start_date": None,
                "end_date": None,
                "description": block.strip()
            }
            
            # Recherche de l'institution (souvent en majuscules)
            institution_match = re.search(r"([A-Z][A-Z\s]+)", block)
            if institution_match:
                edu["institution"] = institution_match.group(1).strip()
                
            # Recherche du diplôme
            for degree in degree_keywords:
                if re.search(degree, block, re.IGNORECASE):
                    degree_match = re.search(r"((?:" + degree + r")[^,\n]*)", block, re.IGNORECASE)
                    if degree_match:
                        edu["degree"] = degree_match.group(1).strip()
                        break
                        
            # Recherche des dates
            dates_in_block = re.findall(date_pattern, block, re.IGNORECASE)
            if len(dates_in_block) >= 2:
                edu["start_date"] = dates_in_block[0]
                edu["end_date"] = dates_in_block[1]
            elif len(dates_in_block) == 1:
                edu["end_date"] = dates_in_block[0]
                    
            education.append(edu)
            
        return education

    def _extract_skills(self, section_text: str) -> List[Dict[str, str]]:
        """
        Extrait les compétences.
        
        Args:
            section_text: Texte de la section compétences
            
        Returns:
            Liste des compétences
        """
        skills = []
        
        # Catégories de compétences
        skill_categories = {
            "technical": [
                "python", "java", "javascript", "c++", "c#", "php", "ruby", "go",
                "html", "css", "sql", "nosql", "react", "angular", "vue", "node",
                "django", "flask", "spring", "laravel", "docker", "kubernetes",
                "aws", "azure", "gcp", "linux", "windows", "macos", "git", "svn",
                "ci/cd", "jenkins", "travis", "github", "gitlab", "bitbucket",
                "agile", "scrum", "kanban", "jira", "confluence", "trello",
                "machine learning", "deep learning", "ai", "data science",
                "big data", "hadoop", "spark", "kafka", "elasticsearch",
                "mongodb", "mysql", "postgresql", "oracle", "sql server",
                "rest", "graphql", "soap", "microservices", "soa", "api"
            ],
            "soft": [
                "communication", "travail d'équipe", "leadership", "gestion de projet",
                "résolution de problèmes", "créativité", "adaptabilité", "autonomie",
                "organisation", "gestion du temps", "négociation", "présentation",
                "prise de décision", "esprit critique", "gestion du stress",
                "empathie", "écoute active", "flexibilité", "persévérance"
            ],
            "language": [
                "français", "anglais", "espagnol", "allemand", "italien",
                "portugais", "russe", "chinois", "japonais", "arabe"
            ]
        }
        
        # Extraction des compétences par catégorie
        for category, keywords in skill_categories.items():
            for keyword in keywords:
                if re.search(r"\b" + re.escape(keyword) + r"\b", section_text, re.IGNORECASE):
                    # Recherche du niveau de compétence à proximité
                    level = None
                    level_pattern = r"(?:" + re.escape(keyword) + r"[^.]*?)(débutant|intermédiaire|avancé|expert|courant|bilingue|natif|professionnel|technique|notions)"
                    level_match = re.search(level_pattern, section_text, re.IGNORECASE)
                    if level_match:
                        level = level_match.group(1).strip().lower()
                        
                    skills.append({
                        "name": keyword,
                        "level": level,
                        "type": category
                    })
                    
        return skills

    def _extract_languages(self, section_text: str) -> List[Dict[str, str]]:
        """
        Extrait les langues.
        
        Args:
            section_text: Texte de la section langues
            
        Returns:
            Liste des langues
        """
        languages = []
        
        # Liste des langues courantes
        language_list = [
            "français", "anglais", "espagnol", "allemand", "italien",
            "portugais", "russe", "chinois", "japonais", "arabe"
        ]
        
        # Niveaux de langue courants
        level_keywords = [
            "débutant", "intermédiaire", "avancé", "expert", "courant",
            "bilingue", "natif", "professionnel", "technique", "notions",
            "a1", "a2", "b1", "b2", "c1", "c2"
        ]
        
        # Extraction des langues
        for language in language_list:
            if re.search(r"\b" + re.escape(language) + r"\b", section_text, re.IGNORECASE):
                # Recherche du niveau de langue à proximité
                level = None
                level_pattern = r"(?:" + re.escape(language) + r"[^.]*?)(débutant|intermédiaire|avancé|expert|courant|bilingue|natif|professionnel|technique|notions|a1|a2|b1|b2|c1|c2)"
                level_match = re.search(level_pattern, section_text, re.IGNORECASE)
                if level_match:
                    level = level_match.group(1).strip().lower()
                    
                languages.append({
                    "name": language,
                    "level": level
                })
                
        return languages