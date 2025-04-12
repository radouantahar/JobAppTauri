#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module d'intégration du feedback Kanban pour l'application d'automatisation de recherche d'emploi
Ce module permet d'analyser le feedback Kanban et d'ajuster le scoring des offres d'emploi.
"""

import os
import json
import logging
import sqlite3
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from collections import Counter, defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class KanbanFeedbackAnalyzer:
    """
    Classe pour analyser le feedback Kanban et ajuster le scoring des offres d'emploi.
    """

    def __init__(self, db_path: str):
        """
        Initialisation de l'analyseur de feedback Kanban.
        
        Args:
            db_path: Chemin vers la base de données SQLite
        """
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Vérifier et créer les tables si nécessaire
        self._ensure_tables_exist()
        
        # Initialiser les vecteurs TF-IDF
        self.tfidf_vectorizer = None
        self.positive_vectors = None
        self.negative_vectors = None

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _ensure_tables_exist(self) -> None:
        """Vérifie et crée les tables nécessaires si elles n'existent pas."""
        try:
            # Vérifier si la table kanban_feedback existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='kanban_feedback'
            """)
            
            if not self.cursor.fetchone():
                logger.info("Création de la table kanban_feedback")
                
                # Créer la table kanban_feedback
                self.cursor.execute("""
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
                """)
            
            # Vérifier si la table kanban_keywords existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='kanban_keywords'
            """)
            
            if not self.cursor.fetchone():
                logger.info("Création de la table kanban_keywords")
                
                # Créer la table kanban_keywords
                self.cursor.execute("""
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
                """)
                
                # Créer un index pour accélérer les recherches
                self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_kanban_keywords_feedback 
                ON kanban_keywords(feedback_id)
                """)
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la vérification/création des tables: {e}")
            self.conn.rollback()
            raise

    def _normalize_text(self, text: str) -> str:
        """
        Normalise un texte pour l'analyse.
        
        Args:
            text: Texte à normaliser
            
        Returns:
            Texte normalisé
        """
        if not text:
            return ""
            
        # Convertir en minuscules
        text = text.lower()
        
        # Supprimer les caractères spéciaux et la ponctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Supprimer les espaces multiples
        text = re.sub(r'\s+', ' ', text)
        
        # Supprimer les espaces en début et fin de chaîne
        text = text.strip()
        
        return text

    def _extract_keywords(self, text: str, min_length: int = 3, max_keywords: int = 50) -> List[str]:
        """
        Extrait les mots-clés d'un texte.
        
        Args:
            text: Texte à analyser
            min_length: Longueur minimale des mots-clés
            max_keywords: Nombre maximum de mots-clés à extraire
            
        Returns:
            Liste des mots-clés extraits
        """
        if not text:
            return []
            
        # Normaliser le texte
        text = self._normalize_text(text)
        
        # Diviser en mots
        words = text.split()
        
        # Filtrer les mots trop courts
        words = [word for word in words if len(word) >= min_length]
        
        # Compter les occurrences
        word_counts = Counter(words)
        
        # Trier par fréquence
        sorted_words = word_counts.most_common(max_keywords)
        
        return [word for word, count in sorted_words]

    def _get_kanban_columns(self) -> Dict[int, Dict[str, Any]]:
        """
        Récupère les colonnes Kanban depuis la base de données.
        
        Returns:
            Dictionnaire des colonnes Kanban
        """
        try:
            # Vérifier si la table kanban_columns existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='kanban_columns'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table kanban_columns n'existe pas encore")
                return {}
            
            # Récupérer les colonnes
            self.cursor.execute("""
            SELECT id, name, position, description 
            FROM kanban_columns 
            ORDER BY position
            """)
            
            columns = self.cursor.fetchall()
            
            return {
                col[0]: {
                    "id": col[0],
                    "name": col[1],
                    "position": col[2],
                    "description": col[3]
                }
                for col in columns
            }
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des colonnes Kanban: {e}")
            return {}

    def _get_kanban_cards(self, column_id: int = None) -> List[Dict[str, Any]]:
        """
        Récupère les cartes Kanban depuis la base de données.
        
        Args:
            column_id: ID de la colonne (si None, toutes les colonnes)
            
        Returns:
            Liste des cartes Kanban
        """
        try:
            # Vérifier si les tables nécessaires existent
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='kanban_cards'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table kanban_cards n'existe pas encore")
                return []
            
            # Construire la requête
            query = """
            SELECT c.id, c.column_id, col.name as column_name, c.job_id, 
                   j.title, j.description, j.location, comp.name as company_name, 
                   j.url, j.source, c.position, c.created_at, c.updated_at
            FROM kanban_cards c
            JOIN kanban_columns col ON c.column_id = col.id
            JOIN jobs j ON c.job_id = j.id
            LEFT JOIN companies comp ON j.company_id = comp.id
            """
            
            params = []
            
            if column_id is not None:
                query += " WHERE c.column_id = ?"
                params.append(column_id)
                
            query += " ORDER BY col.position, c.position"
            
            self.cursor.execute(query, params)
            
            cards = self.cursor.fetchall()
            
            return [
                {
                    "id": card[0],
                    "column_id": card[1],
                    "column_name": card[2],
                    "job_id": card[3],
                    "title": card[4],
                    "description": card[5],
                    "location": card[6],
                    "company_name": card[7],
                    "url": card[8],
                    "source": card[9],
                    "position": card[10],
                    "created_at": card[11],
                    "updated_at": card[12]
                }
                for card in cards
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des cartes Kanban: {e}")
            return []

    def _get_feedback_config(self) -> Dict[str, Dict[str, Any]]:
        """
        Récupère la configuration du feedback Kanban depuis la base de données.
        
        Returns:
            Dictionnaire de la configuration du feedback
        """
        try:
            # Récupérer la configuration existante
            self.cursor.execute("""
            SELECT id, column_id, column_name, feedback_type, weight 
            FROM kanban_feedback
            """)
            
            feedback_config = self.cursor.fetchall()
            
            if feedback_config:
                return {
                    row[2]: {
                        "id": row[0],
                        "column_id": row[1],
                        "column_name": row[2],
                        "feedback_type": row[3],
                        "weight": row[4]
                    }
                    for row in feedback_config
                }
            
            # Si aucune configuration n'existe, créer la configuration par défaut
            columns = self._get_kanban_columns()
            
            if not columns:
                logger.warning("Aucune colonne Kanban trouvée")
                return {}
            
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
            
            # Créer la configuration pour chaque colonne
            config = {}
            
            for col_id, col_data in columns.items():
                col_name = col_data["name"]
                
                if col_name in default_config:
                    feedback_type = default_config[col_name]["feedback_type"]
                    weight = default_config[col_name]["weight"]
                else:
                    # Par défaut, feedback neutre
                    feedback_type = "neutral"
                    weight = 0.0
                
                # Insérer dans la base de données
                self.cursor.execute("""
                INSERT INTO kanban_feedback (column_id, column_name, feedback_type, weight)
                VALUES (?, ?, ?, ?)
                """, (col_id, col_name, feedback_type, weight))
                
                feedback_id = self.cursor.lastrowid
                
                config[col_name] = {
                    "id": feedback_id,
                    "column_id": col_id,
                    "column_name": col_name,
                    "feedback_type": feedback_type,
                    "weight": weight
                }
            
            self.conn.commit()
            
            logger.info(f"Configuration de feedback créée pour {len(config)} colonnes")
            
            return config
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération de la configuration du feedback: {e}")
            self.conn.rollback()
            return {}

    def update_feedback_config(self, column_name: str, feedback_type: str, weight: float) -> bool:
        """
        Met à jour la configuration du feedback pour une colonne.
        
        Args:
            column_name: Nom de la colonne
            feedback_type: Type de feedback (positive, negative, neutral)
            weight: Poids du feedback (entre 0.0 et 1.0)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si la colonne existe
            self.cursor.execute("""
            SELECT id FROM kanban_columns WHERE name = ?
            """, (column_name,))
            
            column_result = self.cursor.fetchone()
            
            if not column_result:
                logger.error(f"Colonne {column_name} non trouvée")
                return False
                
            column_id = column_result[0]
            
            # Vérifier si la configuration existe
            self.cursor.execute("""
            SELECT id FROM kanban_feedback WHERE column_id = ?
            """, (column_id,))
            
            feedback_result = self.cursor.fetchone()
            
            # Valider les paramètres
            if feedback_type not in ["positive", "negative", "neutral"]:
                logger.error(f"Type de feedback invalide: {feedback_type}")
                return False
                
            weight = max(0.0, min(1.0, weight))
            
            if feedback_result:
                # Mettre à jour la configuration existante
                self.cursor.execute("""
                UPDATE kanban_feedback 
                SET feedback_type = ?, weight = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (feedback_type, weight, feedback_result[0]))
            else:
                # Créer une nouvelle configuration
                self.cursor.execute("""
                INSERT INTO kanban_feedback (column_id, column_name, feedback_type, weight)
                VALUES (?, ?, ?, ?)
                """, (column_id, column_name, feedback_type, weight))
            
            self.conn.commit()
            
            logger.info(f"Configuration de feedback mise à jour pour {column_name}: {feedback_type}, {weight}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour de la configuration du feedback: {e}")
            self.conn.rollback()
            return False

    def analyze_kanban_feedback(self) -> Dict[str, Any]:
        """
        Analyse le feedback Kanban et extrait les mots-clés.
        
        Returns:
            Dictionnaire contenant les résultats de l'analyse
        """
        try:
            # Récupérer la configuration du feedback
            feedback_config = self._get_feedback_config()
            
            if not feedback_config:
                logger.error("Aucune configuration de feedback trouvée")
                return {"error": "Aucune configuration de feedback trouvée"}
            
            # Récupérer les colonnes Kanban
            columns = self._get_kanban_columns()
            
            if not columns:
                logger.error("Aucune colonne Kanban trouvée")
                return {"error": "Aucune colonne Kanban trouvée"}
            
            # Initialiser les résultats
            results = {
                "positive_keywords": [],
                "negative_keywords": [],
                "neutral_keywords": [],
                "columns_analyzed": 0,
                "cards_analyzed": 0,
                "keywords_extracted": 0
            }
            
            # Parcourir les colonnes
            for col_id, col_data in columns.items():
                col_name = col_data["name"]
                
                # Vérifier si la colonne a une configuration de feedback
                if col_name not in feedback_config:
                    logger.warning(f"Aucune configuration de feedback pour la colonne {col_name}")
                    continue
                
                feedback_data = feedback_config[col_name]
                feedback_type = feedback_data["feedback_type"]
                feedback_weight = feedback_data["weight"]
                
                # Si le poids est 0, ignorer cette colonne
                if feedback_weight <= 0:
                    continue
                
                # Récupérer les cartes de cette colonne
                cards = self._get_kanban_cards(col_id)
                
                if not cards:
                    logger.info(f"Aucune carte dans la colonne {col_name}")
                    continue
                
                results["columns_analyzed"] += 1
                results["cards_analyzed"] += len(cards)
                
                # Analyser les cartes
                for card in cards:
                    # Construire le texte à analyser
                    text = f"{card['title']} {card['description']} {card['company_name']} {card['location']}"
                    
                    # Extraire les mots-clés
                    keywords = self._extract_keywords(text)
                    
                    results["keywords_extracted"] += len(keywords)
                    
                    # Ajouter les mots-clés à la liste correspondante
                    if feedback_type == "positive":
                        results["positive_keywords"].extend(keywords)
                    elif feedback_type == "negative":
                        results["negative_keywords"].extend(keywords)
                    else:
                        results["neutral_keywords"].extend(keywords)
                    
                    # Enregistrer les mots-clés dans la base de données
                    self._save_keywords(feedback_data["id"], keywords, feedback_weight)
            
            # Compter les occurrences
            results["positive_keywords"] = Counter(results["positive_keywords"]).most_common(100)
            results["negative_keywords"] = Counter(results["negative_keywords"]).most_common(100)
            results["neutral_keywords"] = Counter(results["neutral_keywords"]).most_common(100)
            
            logger.info(f"Analyse terminée: {results['columns_analyzed']} colonnes, {results['cards_analyzed']} cartes, {results['keywords_extracted']} mots-clés")
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du feedback Kanban: {e}")
            return {"error": str(e)}

    def _save_keywords(self, feedback_id: int, keywords: List[str], weight: float) -> None:
        """
        Enregistre les mots-clés dans la base de données.
        
        Args:
            feedback_id: ID de la configuration de feedback
            keywords: Liste des mots-clés
            weight: Poids du feedback
        """
        try:
            # Compter les occurrences
            keyword_counts = Counter(keywords)
            
            # Parcourir les mots-clés
            for keyword, count in keyword_counts.items():
                # Vérifier si le mot-clé existe déjà
                self.cursor.execute("""
                SELECT id, occurrence, weight FROM kanban_keywords 
                WHERE feedback_id = ? AND keyword = ?
                """, (feedback_id, keyword))
                
                keyword_result = self.cursor.fetchone()
                
                if keyword_result:
                    # Mettre à jour le mot-clé existant
                    new_occurrence = keyword_result[1] + count
                    new_weight = (keyword_result[2] * keyword_result[1] + weight * count) / new_occurrence
                    
                    self.cursor.execute("""
                    UPDATE kanban_keywords 
                    SET occurrence = ?, weight = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """, (new_occurrence, new_weight, keyword_result[0]))
                else:
                    # Insérer le nouveau mot-clé
                    self.cursor.execute("""
                    INSERT INTO kanban_keywords (feedback_id, keyword, weight, occurrence)
                    VALUES (?, ?, ?, ?)
                    """, (feedback_id, keyword, weight, count))
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'enregistrement des mots-clés: {e}")
            self.conn.rollback()

    def get_keywords(self, feedback_type: str = None) -> List[Dict[str, Any]]:
        """
        Récupère les mots-clés extraits.
        
        Args:
            feedback_type: Type de feedback (positive, negative, neutral, None pour tous)
            
        Returns:
            Liste des mots-clés
        """
        try:
            # Construire la requête
            query = """
            SELECT k.id, k.feedback_id, f.column_name, f.feedback_type, 
                   k.keyword, k.weight, k.occurrence 
            FROM kanban_keywords k
            JOIN kanban_feedback f ON k.feedback_id = f.id
            """
            
            params = []
            
            if feedback_type:
                query += " WHERE f.feedback_type = ?"
                params.append(feedback_type)
                
            query += " ORDER BY f.feedback_type, k.weight DESC, k.occurrence DESC"
            
            self.cursor.execute(query, params)
            
            keywords = self.cursor.fetchall()
            
            return [
                {
                    "id": kw[0],
                    "feedback_id": kw[1],
                    "column_name": kw[2],
                    "feedback_type": kw[3],
                    "keyword": kw[4],
                    "weight": kw[5],
                    "occurrence": kw[6]
                }
                for kw in keywords
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des mots-clés: {e}")
            return []

    def _build_tfidf_vectors(self) -> None:
        """
        Construit les vecteurs TF-IDF pour les offres positives et négatives.
        """
        try:
            # Récupérer les mots-clés positifs et négatifs
            positive_keywords = self.get_keywords("positive")
            negative_keywords = self.get_keywords("negative")
            
            if not positive_keywords and not negative_keywords:
                logger.warning("Aucun mot-clé trouvé pour construire les vecteurs TF-IDF")
                return
            
            # Construire les documents
            positive_docs = []
            negative_docs = []
            
            # Répéter les mots-clés selon leur occurrence pour augmenter leur importance
            for kw in positive_keywords:
                # Répéter le mot-clé selon son occurrence et son poids
                repetitions = int(kw["occurrence"] * kw["weight"] * 10)
                positive_docs.extend([kw["keyword"]] * repetitions)
            
            for kw in negative_keywords:
                # Répéter le mot-clé selon son occurrence et son poids
                repetitions = int(kw["occurrence"] * kw["weight"] * 10)
                negative_docs.extend([kw["keyword"]] * repetitions)
            
            # Joindre les mots-clés en documents
            positive_text = " ".join(positive_docs)
            negative_text = " ".join(negative_docs)
            
            # Initialiser le vectoriseur TF-IDF
            self.tfidf_vectorizer = TfidfVectorizer(
                min_df=1, 
                max_df=0.9, 
                stop_words="english", 
                ngram_range=(1, 2)
            )
            
            # Construire les vecteurs
            all_texts = [positive_text, negative_text]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(all_texts)
            
            # Séparer les vecteurs positifs et négatifs
            self.positive_vectors = tfidf_matrix[0]
            self.negative_vectors = tfidf_matrix[1]
            
            logger.info("Vecteurs TF-IDF construits")
            
        except Exception as e:
            logger.error(f"Erreur lors de la construction des vecteurs TF-IDF: {e}")
            self.tfidf_vectorizer = None
            self.positive_vectors = None
            self.negative_vectors = None

    def calculate_kanban_score(self, job_text: str) -> Dict[str, float]:
        """
        Calcule un score basé sur le feedback Kanban pour une offre d'emploi.
        
        Args:
            job_text: Texte de l'offre d'emploi
            
        Returns:
            Dictionnaire contenant les scores
        """
        try:
            # Si les vecteurs TF-IDF n'ont pas été construits, les construire
            if self.tfidf_vectorizer is None:
                self._build_tfidf_vectors()
            
            # Si les vecteurs n'ont pas pu être construits, retourner un score neutre
            if self.tfidf_vectorizer is None:
                return {
                    "positive_score": 0.5,
                    "negative_score": 0.5,
                    "kanban_score": 0.5
                }
            
            # Vectoriser le texte de l'offre
            job_vector = self.tfidf_vectorizer.transform([job_text])
            
            # Calculer la similarité avec les vecteurs positifs et négatifs
            positive_similarity = cosine_similarity(job_vector, self.positive_vectors)[0][0]
            negative_similarity = cosine_similarity(job_vector, self.negative_vectors)[0][0]
            
            # Normaliser les scores
            total_similarity = positive_similarity + negative_similarity
            
            if total_similarity > 0:
                positive_score = positive_similarity / total_similarity
                negative_score = negative_similarity / total_similarity
            else:
                positive_score = 0.5
                negative_score = 0.5
            
            # Calculer le score Kanban (entre 0 et 1)
            kanban_score = positive_score
            
            return {
                "positive_score": positive_score,
                "negative_score": negative_score,
                "kanban_score": kanban_score
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score Kanban: {e}")
            return {
                "positive_score": 0.5,
                "negative_score": 0.5,
                "kanban_score": 0.5,
                "error": str(e)
            }

    def update_job_scores(self) -> int:
        """
        Met à jour les scores des offres d'emploi en fonction du feedback Kanban.
        
        Returns:
            Nombre d'offres mises à jour
        """
        try:
            # Récupérer toutes les offres d'emploi
            self.cursor.execute("""
            SELECT j.id, j.title, j.description, j.location, c.name as company_name, 
                   j.matching_score
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            """)
            
            jobs = self.cursor.fetchall()
            
            if not jobs:
                logger.warning("Aucune offre d'emploi trouvée")
                return 0
            
            # Si les vecteurs TF-IDF n'ont pas été construits, les construire
            if self.tfidf_vectorizer is None:
                self._build_tfidf_vectors()
            
            # Si les vecteurs n'ont pas pu être construits, retourner
            if self.tfidf_vectorizer is None:
                logger.error("Impossible de construire les vecteurs TF-IDF")
                return 0
            
            # Compter les offres mises à jour
            updated_count = 0
            
            # Parcourir les offres
            for job in jobs:
                job_id = job[0]
                job_text = f"{job[1]} {job[2]} {job[3]} {job[4]}"
                current_score = job[5] or 0.5
                
                # Calculer le score Kanban
                kanban_scores = self.calculate_kanban_score(job_text)
                kanban_score = kanban_scores["kanban_score"]
                
                # Ajuster le score de matching (moyenne pondérée)
                # 70% score actuel, 30% score Kanban
                new_score = (current_score * 0.7) + (kanban_score * 0.3)
                
                # Mettre à jour le score
                self.cursor.execute("""
                UPDATE jobs 
                SET matching_score = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (new_score, job_id))
                
                updated_count += 1
            
            self.conn.commit()
            
            logger.info(f"{updated_count} offres mises à jour avec les scores Kanban")
            
            return updated_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour des scores: {e}")
            self.conn.rollback()
            return 0

    def optimize_search_keywords(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Optimise les mots-clés de recherche en fonction du feedback Kanban.
        
        Returns:
            Dictionnaire contenant les suggestions de mots-clés
        """
        try:
            # Récupérer les mots-clés positifs et négatifs
            positive_keywords = self.get_keywords("positive")
            negative_keywords = self.get_keywords("negative")
            
            if not positive_keywords and not negative_keywords:
                logger.warning("Aucun mot-clé trouvé pour optimiser les recherches")
                return {"suggested": [], "avoided": []}
            
            # Trier les mots-clés par poids et occurrence
            positive_keywords.sort(key=lambda x: x["weight"] * x["occurrence"], reverse=True)
            negative_keywords.sort(key=lambda x: x["weight"] * x["occurrence"], reverse=True)
            
            # Sélectionner les meilleurs mots-clés positifs
            suggested_keywords = positive_keywords[:20]
            
            # Sélectionner les mots-clés négatifs les plus importants
            avoided_keywords = negative_keywords[:10]
            
            return {
                "suggested": [
                    {
                        "keyword": kw["keyword"],
                        "weight": kw["weight"],
                        "occurrence": kw["occurrence"],
                        "column": kw["column_name"]
                    }
                    for kw in suggested_keywords
                ],
                "avoided": [
                    {
                        "keyword": kw["keyword"],
                        "weight": kw["weight"],
                        "occurrence": kw["occurrence"],
                        "column": kw["column_name"]
                    }
                    for kw in avoided_keywords
                ]
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation des mots-clés de recherche: {e}")
            return {"error": str(e)}

    def update_search_preferences(self) -> int:
        """
        Met à jour les préférences de recherche en fonction du feedback Kanban.
        
        Returns:
            Nombre de mots-clés ajoutés ou mis à jour
        """
        try:
            # Vérifier si la table search_preferences existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='search_preferences'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table search_preferences n'existe pas encore")
                return 0
            
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
            
            # Récupérer les catégories
            self.cursor.execute("SELECT id, name FROM search_categories")
            categories = {name: id for id, name in self.cursor.fetchall()}
            
            if "keywords" not in categories:
                logger.error("Catégorie 'keywords' non trouvée")
                return 0
                
            keywords_category_id = categories["keywords"]
            
            # Optimiser les mots-clés
            optimized_keywords = self.optimize_search_keywords()
            
            if "error" in optimized_keywords:
                logger.error(f"Erreur lors de l'optimisation des mots-clés: {optimized_keywords['error']}")
                return 0
            
            # Compter les mots-clés ajoutés ou mis à jour
            updated_count = 0
            
            # Ajouter les mots-clés suggérés
            for kw in optimized_keywords["suggested"]:
                # Calculer la pondération (entre 0.6 et 1.0)
                weight = 0.6 + (kw["weight"] * 0.4)
                
                # Vérifier si le mot-clé existe déjà
                self.cursor.execute("""
                SELECT id, weight FROM search_keywords 
                WHERE preference_id = ? AND category_id = ? AND keyword = ?
                """, (preference_id, keywords_category_id, kw["keyword"]))
                
                keyword_result = self.cursor.fetchone()
                
                if keyword_result:
                    # Mettre à jour la pondération si elle est plus élevée
                    if weight > keyword_result[1]:
                        self.cursor.execute("""
                        UPDATE search_keywords 
                        SET weight = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """, (weight, keyword_result[0]))
                        
                        updated_count += 1
                else:
                    # Ajouter le nouveau mot-clé
                    self.cursor.execute("""
                    INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
                    VALUES (?, ?, ?, ?)
                    """, (preference_id, keywords_category_id, kw["keyword"], weight))
                    
                    updated_count += 1
            
            # Réduire la pondération des mots-clés à éviter
            for kw in optimized_keywords["avoided"]:
                # Calculer la pondération (entre 0.1 et 0.4)
                weight = 0.4 - (kw["weight"] * 0.3)
                
                # Vérifier si le mot-clé existe déjà
                self.cursor.execute("""
                SELECT id, weight FROM search_keywords 
                WHERE preference_id = ? AND category_id = ? AND keyword = ?
                """, (preference_id, keywords_category_id, kw["keyword"]))
                
                keyword_result = self.cursor.fetchone()
                
                if keyword_result:
                    # Mettre à jour la pondération si elle est plus basse
                    if weight < keyword_result[1]:
                        self.cursor.execute("""
                        UPDATE search_keywords 
                        SET weight = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """, (weight, keyword_result[0]))
                        
                        updated_count += 1
                else:
                    # Ajouter le nouveau mot-clé avec une pondération basse
                    self.cursor.execute("""
                    INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
                    VALUES (?, ?, ?, ?)
                    """, (preference_id, keywords_category_id, kw["keyword"], weight))
                    
                    updated_count += 1
            
            self.conn.commit()
            
            logger.info(f"{updated_count} mots-clés de recherche mis à jour")
            
            return updated_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour des préférences de recherche: {e}")
            self.conn.rollback()
            return 0

    def close(self) -> None:
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyseur de feedback Kanban')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--analyze', help='Analyser le feedback Kanban', action='store_true')
    parser.add_argument('--update-config', help='Mettre à jour la configuration du feedback', action='store_true')
    parser.add_argument('--column', help='Nom de la colonne')
    parser.add_argument('--type', help='Type de feedback (positive, negative, neutral)')
    parser.add_argument('--weight', help='Poids du feedback', type=float)
    parser.add_argument('--list-keywords', help='Lister les mots-clés', action='store_true')
    parser.add_argument('--feedback-type', help='Type de feedback pour les mots-clés')
    parser.add_argument('--update-scores', help='Mettre à jour les scores des offres', action='store_true')
    parser.add_argument('--optimize', help='Optimiser les mots-clés de recherche', action='store_true')
    parser.add_argument('--update-preferences', help='Mettre à jour les préférences de recherche', action='store_true')
    
    args = parser.parse_args()
    
    # Initialiser l'analyseur de feedback
    analyzer = KanbanFeedbackAnalyzer(args.db)
    
    if args.analyze:
        # Analyser le feedback Kanban
        results = analyzer.analyze_kanban_feedback()
        
        if "error" in results:
            print(f"Erreur: {results['error']}")
        else:
            print(f"Analyse terminée:")
            print(f"  Colonnes analysées: {results['columns_analyzed']}")
            print(f"  Cartes analysées: {results['cards_analyzed']}")
            print(f"  Mots-clés extraits: {results['keywords_extracted']}")
            
            print("\nMots-clés positifs:")
            for keyword, count in results["positive_keywords"][:20]:
                print(f"  - {keyword}: {count}")
            
            print("\nMots-clés négatifs:")
            for keyword, count in results["negative_keywords"][:20]:
                print(f"  - {keyword}: {count}")
    
    elif args.update_config:
        # Mettre à jour la configuration du feedback
        if not args.column or not args.type or args.weight is None:
            print("Erreur: --column, --type et --weight sont requis pour mettre à jour la configuration")
        else:
            success = analyzer.update_feedback_config(args.column, args.type, args.weight)
            if success:
                print(f"Configuration mise à jour pour {args.column}: {args.type}, {args.weight}")
            else:
                print("Erreur lors de la mise à jour de la configuration")
    
    elif args.list_keywords:
        # Lister les mots-clés
        keywords = analyzer.get_keywords(args.feedback_type)
        
        print(f"{len(keywords)} mots-clés trouvés:")
        
        current_type = None
        for kw in keywords[:100]:  # Limiter à 100 mots-clés
            if current_type != kw['feedback_type']:
                current_type = kw['feedback_type']
                print(f"\n{current_type.capitalize()}:")
                
            print(f"  - {kw['keyword']}: poids={kw['weight']:.2f}, occurrences={kw['occurrence']} ({kw['column_name']})")
    
    elif args.update_scores:
        # Mettre à jour les scores des offres
        updated_count = analyzer.update_job_scores()
        print(f"{updated_count} offres mises à jour avec les scores Kanban")
    
    elif args.optimize:
        # Optimiser les mots-clés de recherche
        optimized = analyzer.optimize_search_keywords()
        
        if "error" in optimized:
            print(f"Erreur: {optimized['error']}")
        else:
            print("Mots-clés suggérés:")
            for kw in optimized["suggested"]:
                print(f"  - {kw['keyword']}: poids={kw['weight']:.2f}, occurrences={kw['occurrence']} ({kw['column']})")
            
            print("\nMots-clés à éviter:")
            for kw in optimized["avoided"]:
                print(f"  - {kw['keyword']}: poids={kw['weight']:.2f}, occurrences={kw['occurrence']} ({kw['column']})")
    
    elif args.update_preferences:
        # Mettre à jour les préférences de recherche
        updated_count = analyzer.update_search_preferences()
        print(f"{updated_count} mots-clés de recherche mis à jour")
    
    else:
        # Afficher l'aide
        parser.print_help()
    
    # Fermer la connexion
    analyzer.close()
