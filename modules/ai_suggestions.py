#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de suggestions IA basées sur le CV pour l'application d'automatisation de recherche d'emploi
Ce module utilise le LLM local ou distant pour générer des suggestions de recherche d'emploi
basées sur le CV de l'utilisateur.
"""

import os
import json
import logging
import sqlite3
import time
from typing import Dict, List, Optional, Any, Tuple
import requests

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AIJobSuggestionEngine:
    """
    Classe pour générer des suggestions de recherche d'emploi basées sur le CV
    en utilisant un LLM local ou distant.
    """

    def __init__(self, db_path: str, api_url: str = None, api_key: str = None):
        """
        Initialisation du moteur de suggestions IA.
        
        Args:
            db_path: Chemin vers la base de données SQLite
            api_url: URL de l'API LLM (si None, utilise l'API configurée dans la base de données)
            api_key: Clé d'API (si None, utilise la clé configurée dans la base de données)
        """
        self.db_path = db_path
        self.api_url = api_url
        self.api_key = api_key
        self.conn = None
        self.cursor = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Si l'API n'est pas spécifiée, utiliser l'API configurée dans la base de données
        if not self.api_url:
            self._load_api_config()

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _load_api_config(self) -> None:
        """Charge la configuration de l'API depuis la base de données."""
        try:
            # Vérifier si la table api_providers existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='api_providers'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table api_providers n'existe pas encore")
                # Utiliser Ollama par défaut
                self.api_url = "http://localhost:11434"
                self.api_type = "local"
                self.model = "llama3:8b"
                return
            
            # Récupérer l'API active avec la priorité la plus élevée
            self.cursor.execute("""
            SELECT api_url, api_key, api_type, models 
            FROM api_providers 
            WHERE is_active = 1 
            ORDER BY priority 
            LIMIT 1
            """)
            
            api_config = self.cursor.fetchone()
            
            if not api_config:
                logger.warning("Aucune API active trouvée, utilisation d'Ollama par défaut")
                # Utiliser Ollama par défaut
                self.api_url = "http://localhost:11434"
                self.api_type = "local"
                self.model = "llama3:8b"
                return
            
            self.api_url = api_config[0]
            self.api_key = api_config[1]
            self.api_type = api_config[2]
            
            # Charger les modèles disponibles
            try:
                models = json.loads(api_config[3])
                self.model = models[0] if models else "llama3:8b"
            except (json.JSONDecodeError, IndexError):
                logger.warning("Erreur lors du chargement des modèles, utilisation du modèle par défaut")
                self.model = "llama3:8b"
            
            logger.info(f"Configuration API chargée: {self.api_type} - {self.api_url} - {self.model}")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors du chargement de la configuration API: {e}")
            # Utiliser Ollama par défaut
            self.api_url = "http://localhost:11434"
            self.api_type = "local"
            self.model = "llama3:8b"

    def _log_api_usage(self, provider_id: int, operation_type: str, tokens_used: int, estimated_cost: float) -> None:
        """
        Enregistre l'utilisation de l'API dans la base de données.
        
        Args:
            provider_id: ID du fournisseur d'API
            operation_type: Type d'opération (ex: "suggestions")
            tokens_used: Nombre de tokens utilisés
            estimated_cost: Coût estimé
        """
        try:
            # Vérifier si la table api_usage existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='api_usage'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table api_usage n'existe pas encore")
                return
            
            # Enregistrer l'utilisation
            self.cursor.execute("""
            INSERT INTO api_usage (provider_id, operation_type, tokens_used, estimated_cost)
            VALUES (?, ?, ?, ?)
            """, (provider_id, operation_type, tokens_used, estimated_cost))
            
            self.conn.commit()
            
            logger.info(f"Utilisation API enregistrée: {operation_type} - {tokens_used} tokens - {estimated_cost}€")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'enregistrement de l'utilisation API: {e}")
            self.conn.rollback()

    def _get_api_provider_id(self) -> int:
        """
        Récupère l'ID du fournisseur d'API actif.
        
        Returns:
            ID du fournisseur d'API
        """
        try:
            # Récupérer l'ID du fournisseur d'API
            self.cursor.execute("""
            SELECT id FROM api_providers 
            WHERE api_url = ? AND is_active = 1
            LIMIT 1
            """, (self.api_url,))
            
            provider_id_result = self.cursor.fetchone()
            
            if not provider_id_result:
                logger.warning(f"Aucun fournisseur d'API trouvé pour {self.api_url}")
                return -1
                
            return provider_id_result[0]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération de l'ID du fournisseur d'API: {e}")
            return -1

    def _get_user_profile(self) -> Dict[str, Any]:
        """
        Récupère le profil de l'utilisateur depuis la base de données.
        
        Returns:
            Dictionnaire contenant le profil de l'utilisateur
        """
        try:
            # Récupérer le profil de base
            self.cursor.execute("""
            SELECT id, name, email, phone, location, title, summary 
            FROM user_profile 
            LIMIT 1
            """)
            
            profile_result = self.cursor.fetchone()
            
            if not profile_result:
                logger.error("Aucun profil utilisateur trouvé")
                return {}
                
            user_id = profile_result[0]
            
            profile = {
                "id": user_id,
                "name": profile_result[1],
                "email": profile_result[2],
                "phone": profile_result[3],
                "location": profile_result[4],
                "title": profile_result[5],
                "summary": profile_result[6],
                "skills": [],
                "experiences": [],
                "education": [],
                "languages": []
            }
            
            # Récupérer les compétences
            self.cursor.execute("""
            SELECT skill_name, skill_level 
            FROM user_skills 
            WHERE user_id = ?
            """, (user_id,))
            
            skills_result = self.cursor.fetchall()
            
            profile["skills"] = [
                {
                    "name": skill[0],
                    "level": skill[1]
                }
                for skill in skills_result
            ]
            
            # Récupérer les expériences
            self.cursor.execute("""
            SELECT company_name, position, start_date, end_date, description 
            FROM user_experiences 
            WHERE user_id = ? 
            ORDER BY start_date DESC
            """, (user_id,))
            
            experiences_result = self.cursor.fetchall()
            
            profile["experiences"] = [
                {
                    "company": exp[0],
                    "position": exp[1],
                    "start_date": exp[2],
                    "end_date": exp[3],
                    "description": exp[4]
                }
                for exp in experiences_result
            ]
            
            # Récupérer les formations
            self.cursor.execute("""
            SELECT institution, degree, field, start_date, end_date, description 
            FROM user_education 
            WHERE user_id = ? 
            ORDER BY start_date DESC
            """, (user_id,))
            
            education_result = self.cursor.fetchall()
            
            profile["education"] = [
                {
                    "institution": edu[0],
                    "degree": edu[1],
                    "field": edu[2],
                    "start_date": edu[3],
                    "end_date": edu[4],
                    "description": edu[5]
                }
                for edu in education_result
            ]
            
            # Récupérer les langues
            self.cursor.execute("""
            SELECT name, level 
            FROM user_languages 
            WHERE user_id = ?
            """, (user_id,))
            
            languages_result = self.cursor.fetchall()
            
            profile["languages"] = [
                {
                    "name": lang[0],
                    "level": lang[1]
                }
                for lang in languages_result
            ]
            
            return profile
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération du profil utilisateur: {e}")
            return {}

    def _get_search_categories(self) -> List[Dict[str, Any]]:
        """
        Récupère les catégories de recherche depuis la base de données.
        
        Returns:
            Liste des catégories de recherche
        """
        try:
            self.cursor.execute("""
            SELECT id, name, description 
            FROM search_categories 
            ORDER BY id
            """)
            
            categories_result = self.cursor.fetchall()
            
            return [
                {
                    "id": cat[0],
                    "name": cat[1],
                    "description": cat[2]
                }
                for cat in categories_result
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des catégories de recherche: {e}")
            return []

    def _get_kanban_feedback(self) -> Dict[str, List[str]]:
        """
        Récupère les informations de feedback Kanban depuis la base de données.
        
        Returns:
            Dictionnaire contenant les mots-clés des offres favorisées et rejetées
        """
        try:
            feedback = {
                "favoris": [],
                "rejets": []
            }
            
            # Récupérer les offres favorisées (colonne "For Application")
            self.cursor.execute("""
            SELECT j.title, j.description 
            FROM jobs j
            JOIN kanban_cards k ON j.id = k.job_id
            JOIN kanban_columns c ON k.column_id = c.id
            WHERE c.name = 'For Application'
            LIMIT 20
            """)
            
            favoris_result = self.cursor.fetchall()
            
            for favori in favoris_result:
                if favori[0]:
                    feedback["favoris"].append(favori[0])
                
                # Extraire quelques mots-clés de la description
                if favori[1]:
                    # Simplification: prendre les 10 premiers mots
                    words = favori[1].split()[:10]
                    feedback["favoris"].extend(words)
            
            # Récupérer les offres rejetées (colonne "Rejected by me")
            self.cursor.execute("""
            SELECT j.title, j.description 
            FROM jobs j
            JOIN kanban_cards k ON j.id = k.job_id
            JOIN kanban_columns c ON k.column_id = c.id
            WHERE c.name = 'Rejected by me'
            LIMIT 20
            """)
            
            rejets_result = self.cursor.fetchall()
            
            for rejet in rejets_result:
                if rejet[0]:
                    feedback["rejets"].append(rejet[0])
                
                # Extraire quelques mots-clés de la description
                if rejet[1]:
                    # Simplification: prendre les 10 premiers mots
                    words = rejet[1].split()[:10]
                    feedback["rejets"].extend(words)
            
            return feedback
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération du feedback Kanban: {e}")
            return {"favoris": [], "rejets": []}

    def _generate_suggestions_with_ollama(self, prompt: str) -> Dict[str, Any]:
        """
        Génère des suggestions en utilisant l'API Ollama locale.
        
        Args:
            prompt: Prompt pour le LLM
            
        Returns:
            Dictionnaire contenant les suggestions générées
        """
        try:
            # Construire l'URL de l'API
            api_endpoint = f"{self.api_url}/api/generate"
            
            # Construire la requête
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
            
            # Envoyer la requête
            response = requests.post(api_endpoint, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la requête à l'API Ollama: {response.status_code} - {response.text}")
                return {"error": f"Erreur API: {response.status_code}"}
            
            # Traiter la réponse
            result = response.json()
            
            # Estimer l'utilisation de tokens (approximatif)
            prompt_tokens = len(prompt.split())
            response_tokens = len(result.get("response", "").split())
            total_tokens = prompt_tokens + response_tokens
            
            # Enregistrer l'utilisation de l'API
            provider_id = self._get_api_provider_id()
            if provider_id > 0:
                self._log_api_usage(provider_id, "suggestions", total_tokens, 0.0)  # Coût 0 pour Ollama local
            
            # Extraire les suggestions du texte généré
            suggestions = self._parse_suggestions_from_text(result.get("response", ""))
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de suggestions avec Ollama: {e}")
            return {"error": str(e)}

    def _generate_suggestions_with_openai(self, prompt: str) -> Dict[str, Any]:
        """
        Génère des suggestions en utilisant l'API OpenAI.
        
        Args:
            prompt: Prompt pour le LLM
            
        Returns:
            Dictionnaire contenant les suggestions générées
        """
        try:
            # Construire l'URL de l'API
            api_endpoint = f"{self.api_url}/chat/completions"
            
            # Construire la requête
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "Vous êtes un assistant spécialisé dans la recherche d'emploi qui génère des suggestions de mots-clés pour aider à trouver des offres pertinentes."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            
            # Envoyer la requête
            response = requests.post(api_endpoint, headers=headers, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la requête à l'API OpenAI: {response.status_code} - {response.text}")
                return {"error": f"Erreur API: {response.status_code}"}
            
            # Traiter la réponse
            result = response.json()
            
            # Récupérer l'utilisation de tokens
            prompt_tokens = result.get("usage", {}).get("prompt_tokens", 0)
            completion_tokens = result.get("usage", {}).get("completion_tokens", 0)
            total_tokens = result.get("usage", {}).get("total_tokens", 0)
            
            # Calculer le coût estimé (approximatif)
            # Prix pour gpt-3.5-turbo: $0.0015 / 1K tokens d'entrée, $0.002 / 1K tokens de sortie
            input_cost = (prompt_tokens / 1000) * 0.0015
            output_cost = (completion_tokens / 1000) * 0.002
            estimated_cost = input_cost + output_cost
            
            # Enregistrer l'utilisation de l'API
            provider_id = self._get_api_provider_id()
            if provider_id > 0:
                self._log_api_usage(provider_id, "suggestions", total_tokens, estimated_cost)
            
            # Extraire le texte généré
            generated_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Extraire les suggestions du texte généré
            suggestions = self._parse_suggestions_from_text(generated_text)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de suggestions avec OpenAI: {e}")
            return {"error": str(e)}

    def _generate_suggestions_with_anthropic(self, prompt: str) -> Dict[str, Any]:
        """
        Génère des suggestions en utilisant l'API Anthropic.
        
        Args:
            prompt: Prompt pour le LLM
            
        Returns:
            Dictionnaire contenant les suggestions générées
        """
        try:
            # Construire l'URL de l'API
            api_endpoint = f"{self.api_url}/messages"
            
            # Construire la requête
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            # Envoyer la requête
            response = requests.post(api_endpoint, headers=headers, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la requête à l'API Anthropic: {response.status_code} - {response.text}")
                return {"error": f"Erreur API: {response.status_code}"}
            
            # Traiter la réponse
            result = response.json()
            
            # Estimer l'utilisation de tokens (approximatif)
            prompt_tokens = len(prompt.split()) * 1.3  # Facteur de conversion approximatif
            generated_text = result.get("content", [{}])[0].get("text", "")
            completion_tokens = len(generated_text.split()) * 1.3
            total_tokens = int(prompt_tokens + completion_tokens)
            
            # Calculer le coût estimé (approximatif)
            # Prix pour Claude: $0.003 / 1K tokens (entrée + sortie)
            estimated_cost = (total_tokens / 1000) * 0.003
            
            # Enregistrer l'utilisation de l'API
            provider_id = self._get_api_provider_id()
            if provider_id > 0:
                self._log_api_usage(provider_id, "suggestions", total_tokens, estimated_cost)
            
            # Extraire les suggestions du texte généré
            suggestions = self._parse_suggestions_from_text(generated_text)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de suggestions avec Anthropic: {e}")
            return {"error": str(e)}

    def _parse_suggestions_from_text(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extrait les suggestions du texte généré par le LLM.
        
        Args:
            text: Texte généré par le LLM
            
        Returns:
            Dictionnaire contenant les suggestions par catégorie
        """
        try:
            # Initialiser le dictionnaire de résultats
            result = {}
            
            # Essayer d'extraire un format JSON
            json_match = text.find("{")
            if json_match >= 0:
                # Extraire le JSON du texte
                json_text = text[json_match:]
                
                # Trouver la fin du JSON
                json_end = json_text.rfind("}")
                if json_end >= 0:
                    json_text = json_text[:json_end+1]
                
                try:
                    # Parser le JSON
                    parsed_json = json.loads(json_text)
                    
                    # Si le JSON est valide et contient des suggestions, le retourner directement
                    if isinstance(parsed_json, dict) and any(key in parsed_json for key in ["technical_skills", "job_titles", "industries"]):
                        return parsed_json
                except json.JSONDecodeError:
                    pass
            
            # Si l'extraction JSON a échoué, parser le texte manuellement
            current_category = None
            
            for line in text.split("\n"):
                line = line.strip()
                
                if not line:
                    continue
                
                # Détecter les titres de catégorie
                if line.endswith(":") and not line.startswith("-") and not line.startswith("*"):
                    category_name = line.rstrip(":").lower().replace(" ", "_")
                    current_category = category_name
                    result[current_category] = []
                    continue
                
                # Détecter les éléments de liste
                if (line.startswith("-") or line.startswith("*")) and current_category:
                    # Extraire le mot-clé
                    keyword_text = line[1:].strip()
                    
                    # Extraire la pondération si présente
                    weight = 0.7  # Pondération par défaut
                    weight_match = keyword_text.rfind("(")
                    reason = None
                    
                    if weight_match >= 0:
                        weight_text = keyword_text[weight_match:].lower()
                        keyword_text = keyword_text[:weight_match].strip()
                        
                        # Extraire la valeur numérique
                        import re
                        weight_value = re.search(r"(\d+(\.\d+)?)", weight_text)
                        if weight_value:
                            try:
                                weight = float(weight_value.group(1))
                                # Normaliser entre 0 et 1
                                if weight > 1:
                                    weight = weight / 10
                                weight = min(1.0, max(0.1, weight))
                            except ValueError:
                                pass
                    
                    # Extraire la raison si présente
                    reason_match = keyword_text.find("-")
                    if reason_match >= 0:
                        reason = keyword_text[reason_match+1:].strip()
                        keyword_text = keyword_text[:reason_match].strip()
                    
                    # Ajouter le mot-clé à la catégorie courante
                    result[current_category].append({
                        "keyword": keyword_text,
                        "weight": weight,
                        "reason": reason
                    })
            
            # Si aucune catégorie n'a été détectée, essayer de détecter les mots-clés directement
            if not result:
                result["keywords"] = []
                
                for line in text.split("\n"):
                    line = line.strip()
                    
                    if not line or len(line) < 3:
                        continue
                    
                    if line.startswith("-") or line.startswith("*"):
                        keyword_text = line[1:].strip()
                        result["keywords"].append({
                            "keyword": keyword_text,
                            "weight": 0.7,
                            "reason": None
                        })
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des suggestions: {e}")
            return {"keywords": []}

    def _save_suggestions(self, suggestions: Dict[str, List[Dict[str, Any]]]) -> int:
        """
        Sauvegarde les suggestions dans la base de données.
        
        Args:
            suggestions: Dictionnaire contenant les suggestions par catégorie
            
        Returns:
            Nombre de suggestions sauvegardées
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return 0
                
            user_id = user_id_result[0]
            
            # Récupérer les catégories
            categories = {}
            self.cursor.execute("SELECT id, name FROM search_categories")
            for cat_id, cat_name in self.cursor.fetchall():
                categories[cat_name] = cat_id
            
            # Compter les suggestions sauvegardées
            saved_count = 0
            
            # Parcourir les suggestions par catégorie
            for category_name, keywords in suggestions.items():
                # Convertir le nom de la catégorie au format de la base de données
                db_category_name = category_name.lower().replace(" ", "_")
                
                # Récupérer l'ID de la catégorie
                category_id = categories.get(db_category_name)
                
                # Si la catégorie n'existe pas, utiliser la catégorie "keywords"
                if not category_id:
                    category_id = categories.get("keywords")
                    
                    # Si la catégorie "keywords" n'existe pas non plus, passer à la suite
                    if not category_id:
                        continue
                
                # Parcourir les mots-clés
                for keyword_data in keywords:
                    keyword = keyword_data.get("keyword")
                    weight = keyword_data.get("weight", 0.7)
                    reason = keyword_data.get("reason")
                    
                    if not keyword:
                        continue
                    
                    # Vérifier si la suggestion existe déjà
                    self.cursor.execute("""
                    SELECT id FROM search_suggestions 
                    WHERE user_id = ? AND category_id = ? AND keyword = ?
                    """, (user_id, category_id, keyword))
                    
                    existing_suggestion = self.cursor.fetchone()
                    
                    if existing_suggestion:
                        # Mettre à jour la suggestion existante
                        self.cursor.execute("""
                        UPDATE search_suggestions 
                        SET weight = ?, reason = ?
                        WHERE id = ?
                        """, (weight, reason, existing_suggestion[0]))
                    else:
                        # Insérer la nouvelle suggestion
                        self.cursor.execute("""
                        INSERT INTO search_suggestions (user_id, category_id, keyword, weight, reason)
                        VALUES (?, ?, ?, ?, ?)
                        """, (user_id, category_id, keyword, weight, reason))
                    
                    saved_count += 1
            
            self.conn.commit()
            
            logger.info(f"{saved_count} suggestions sauvegardées")
            
            return saved_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la sauvegarde des suggestions: {e}")
            self.conn.rollback()
            return 0

    def generate_suggestions_from_cv(self) -> Dict[str, Any]:
        """
        Génère des suggestions de recherche d'emploi basées sur le CV de l'utilisateur.
        
        Returns:
            Dictionnaire contenant les suggestions générées
        """
        try:
            # Récupérer le profil de l'utilisateur
            profile = self._get_user_profile()
            
            if not profile:
                return {"error": "Aucun profil utilisateur trouvé"}
            
            # Récupérer les catégories de recherche
            categories = self._get_search_categories()
            
            # Construire le prompt
            prompt = f"""En tant qu'expert en recherche d'emploi, analysez le CV suivant et générez des suggestions de mots-clés pour la recherche d'emploi, organisées par catégorie. Pour chaque mot-clé, attribuez une pondération entre 0.1 et 1.0 indiquant sa pertinence.

Profil:
Nom: {profile.get('name', 'Non spécifié')}
Titre: {profile.get('title', 'Non spécifié')}
Résumé: {profile.get('summary', 'Non spécifié')}
Localisation: {profile.get('location', 'Non spécifiée')}

Compétences:
{chr(10).join([f"- {skill.get('name', '')} ({skill.get('level', '')})" for skill in profile.get('skills', [])])}

Expériences professionnelles:
{chr(10).join([f"- {exp.get('position', '')} chez {exp.get('company', '')} ({exp.get('start_date', '')} - {exp.get('end_date', '')}) : {exp.get('description', '')}" for exp in profile.get('experiences', [])])}

Formation:
{chr(10).join([f"- {edu.get('degree', '')} en {edu.get('field', '')} à {edu.get('institution', '')} ({edu.get('start_date', '')} - {edu.get('end_date', '')})" for edu in profile.get('education', [])])}

Langues:
{chr(10).join([f"- {lang.get('name', '')} ({lang.get('level', '')})" for lang in profile.get('languages', [])])}

Catégories de recherche:
{chr(10).join([f"- {cat.get('name', '')} : {cat.get('description', '')}" for cat in categories])}

Générez des suggestions de mots-clés pour chaque catégorie pertinente, avec une pondération entre 0.1 et 1.0 et une brève explication de la raison de cette suggestion. Formatez votre réponse en JSON comme suit:
```json
{
  "technical_skills": [
    {"keyword": "Python", "weight": 0.9, "reason": "Compétence principale mentionnée dans le CV"},
    {"keyword": "Data Analysis", "weight": 0.8, "reason": "Utilisé dans plusieurs expériences professionnelles"}
  ],
  "job_titles": [
    {"keyword": "Data Scientist", "weight": 0.9, "reason": "Correspond au titre actuel et aux compétences"},
    {"keyword": "Data Analyst", "weight": 0.7, "reason": "Rôle précédent dans la carrière"}
  ],
  "industries": [
    {"keyword": "Finance", "weight": 0.8, "reason": "Expérience significative dans ce secteur"},
    {"keyword": "Technology", "weight": 0.7, "reason": "Compétences techniques alignées avec ce secteur"}
  ]
}
```
"""
            
            # Récupérer le feedback Kanban si disponible
            kanban_feedback = self._get_kanban_feedback()
            
            if kanban_feedback.get("favoris") or kanban_feedback.get("rejets"):
                prompt += f"""

Tenez également compte du feedback suivant basé sur les préférences de l'utilisateur:

Offres favorisées:
{chr(10).join([f"- {favori}" for favori in kanban_feedback.get("favoris", [])[:10]])}

Offres rejetées:
{chr(10).join([f"- {rejet}" for rejet in kanban_feedback.get("rejets", [])[:10]])}

Ajustez les suggestions en fonction de ces préférences, en augmentant la pondération des mots-clés similaires aux offres favorisées et en diminuant celle des mots-clés similaires aux offres rejetées.
"""
            
            # Générer les suggestions selon le type d'API
            if self.api_type == "local":
                suggestions = self._generate_suggestions_with_ollama(prompt)
            elif "openai" in self.api_url:
                suggestions = self._generate_suggestions_with_openai(prompt)
            elif "anthropic" in self.api_url:
                suggestions = self._generate_suggestions_with_anthropic(prompt)
            else:
                # Par défaut, utiliser Ollama
                suggestions = self._generate_suggestions_with_ollama(prompt)
            
            # Sauvegarder les suggestions dans la base de données
            if "error" not in suggestions:
                saved_count = self._save_suggestions(suggestions)
                suggestions["saved_count"] = saved_count
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des suggestions: {e}")
            return {"error": str(e)}

    def apply_all_suggestions(self) -> int:
        """
        Applique toutes les suggestions non appliquées.
        
        Returns:
            Nombre de suggestions appliquées
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return 0
                
            user_id = user_id_result[0]
            
            # Récupérer l'ensemble de préférences actif
            self.cursor.execute("""
            SELECT id FROM search_preferences 
            WHERE user_id = ? AND is_active = 1
            LIMIT 1
            """, (user_id,))
            
            preference_result = self.cursor.fetchone()
            
            if not preference_result:
                logger.error("Aucun ensemble de préférences actif trouvé")
                return 0
                
            preference_id = preference_result[0]
            
            # Récupérer les suggestions non appliquées
            self.cursor.execute("""
            SELECT id, category_id, keyword, weight 
            FROM search_suggestions 
            WHERE user_id = ? AND is_applied = 0
            """, (user_id,))
            
            suggestions = self.cursor.fetchall()
            
            # Compter les suggestions appliquées
            applied_count = 0
            
            # Parcourir les suggestions
            for suggestion in suggestions:
                suggestion_id, category_id, keyword, weight = suggestion
                
                # Ajouter le mot-clé à l'ensemble de préférences actif
                self.cursor.execute("""
                INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
                VALUES (?, ?, ?, ?)
                """, (preference_id, category_id, keyword, weight))
                
                # Marquer la suggestion comme appliquée
                self.cursor.execute("""
                UPDATE search_suggestions 
                SET is_applied = 1
                WHERE id = ?
                """, (suggestion_id,))
                
                applied_count += 1
            
            self.conn.commit()
            
            logger.info(f"{applied_count} suggestions appliquées")
            
            return applied_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'application des suggestions: {e}")
            self.conn.rollback()
            return 0

    def get_suggestions(self, applied_only: bool = False) -> List[Dict[str, Any]]:
        """
        Récupère les suggestions de recherche.
        
        Args:
            applied_only: Si True, récupère uniquement les suggestions appliquées
            
        Returns:
            Liste des suggestions
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return []
                
            user_id = user_id_result[0]
            
            # Construire la requête
            query = """
            SELECT s.id, s.category_id, c.name as category_name, 
                   s.keyword, s.weight, s.reason, s.is_applied 
            FROM search_suggestions s
            JOIN search_categories c ON s.category_id = c.id
            WHERE s.user_id = ?
            """
            
            params = [user_id]
            
            if applied_only:
                query += " AND s.is_applied = 1"
                
            query += " ORDER BY c.name, s.weight DESC, s.keyword"
            
            self.cursor.execute(query, params)
            
            suggestions = self.cursor.fetchall()
            
            return [
                {
                    "id": sugg[0],
                    "category_id": sugg[1],
                    "category_name": sugg[2],
                    "keyword": sugg[3],
                    "weight": sugg[4],
                    "reason": sugg[5],
                    "is_applied": bool(sugg[6])
                }
                for sugg in suggestions
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des suggestions: {e}")
            return []

    def close(self) -> None:
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Moteur de suggestions IA pour la recherche d\'emploi')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--api-url', help='URL de l\'API LLM')
    parser.add_argument('--api-key', help='Clé d\'API')
    parser.add_argument('--generate', help='Générer des suggestions', action='store_true')
    parser.add_argument('--apply-all', help='Appliquer toutes les suggestions', action='store_true')
    parser.add_argument('--list', help='Lister les suggestions', action='store_true')
    parser.add_argument('--applied-only', help='Lister uniquement les suggestions appliquées', action='store_true')
    
    args = parser.parse_args()
    
    # Initialiser le moteur de suggestions
    suggestion_engine = AIJobSuggestionEngine(args.db, args.api_url, args.api_key)
    
    if args.generate:
        # Générer des suggestions
        print("Génération de suggestions en cours...")
        result = suggestion_engine.generate_suggestions_from_cv()
        
        if "error" in result:
            print(f"Erreur: {result['error']}")
        else:
            print(f"Suggestions générées avec succès ({result.get('saved_count', 0)} sauvegardées)")
            
            # Afficher les suggestions par catégorie
            for category, keywords in result.items():
                if category != "saved_count" and keywords:
                    print(f"\n{category.replace('_', ' ').title()}:")
                    for kw in keywords:
                        reason = f" - {kw.get('reason')}" if kw.get('reason') else ""
                        print(f"  - {kw.get('keyword')} (pondération: {kw.get('weight', 0.7):.1f}){reason}")
    
    elif args.apply_all:
        # Appliquer toutes les suggestions
        applied_count = suggestion_engine.apply_all_suggestions()
        print(f"{applied_count} suggestions appliquées")
    
    elif args.list:
        # Lister les suggestions
        suggestions = suggestion_engine.get_suggestions(args.applied_only)
        
        applied_text = "appliquées" if args.applied_only else "configurées"
        print(f"{len(suggestions)} suggestions {applied_text}:")
        
        current_category = None
        for sugg in suggestions:
            if current_category != sugg['category_name']:
                current_category = sugg['category_name']
                print(f"\n{current_category}:")
                
            applied = " (Appliquée)" if sugg["is_applied"] else ""
            reason = f" - {sugg['reason']}" if sugg['reason'] else ""
            print(f"  - ID {sugg['id']}: {sugg['keyword']} (pondération: {sugg['weight']:.1f}){applied}{reason}")
    
    else:
        # Afficher l'aide
        parser.print_help()
    
    # Fermer la connexion
    suggestion_engine.close()
