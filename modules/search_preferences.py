#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de gestion des préférences de recherche pour l'application d'automatisation de recherche d'emploi
Ce module permet de gérer les préférences de recherche de l'utilisateur avec pondération.
"""

import os
import json
import logging
import sqlite3
from typing import Dict, List, Optional, Any, Tuple

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SearchPreferencesManager:
    """
    Classe pour gérer les préférences de recherche de l'utilisateur avec pondération.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du gestionnaire de préférences de recherche.
        
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
            # Vérifier si les tables existent
            tables_to_check = [
                'search_preferences',
                'search_categories',
                'search_keywords',
                'search_suggestions'
            ]
            
            existing_tables = set()
            for table in tables_to_check:
                self.cursor.execute(f"""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='{table}'
                """)
                
                if self.cursor.fetchone():
                    existing_tables.add(table)
            
            # Créer les tables manquantes
            if 'search_categories' not in existing_tables:
                logger.info("Création de la table search_categories")
                
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS search_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Insérer les catégories par défaut
                self._create_default_categories()
            
            if 'search_preferences' not in existing_tables:
                logger.info("Création de la table search_preferences")
                
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS search_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
                )
                """)
                
                # Créer un ensemble de préférences par défaut
                self._create_default_preferences()
            
            if 'search_keywords' not in existing_tables:
                logger.info("Création de la table search_keywords")
                
                self.cursor.execute("""
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
                """)
            
            if 'search_suggestions' not in existing_tables:
                logger.info("Création de la table search_suggestions")
                
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS search_suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    category_id INTEGER NOT NULL,
                    keyword TEXT NOT NULL,
                    weight REAL DEFAULT 1.0,
                    reason TEXT,
                    is_applied BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES search_categories(id) ON DELETE CASCADE
                )
                """)
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la vérification/création des tables: {e}")
            self.conn.rollback()
            raise

    def _create_default_categories(self) -> None:
        """Crée les catégories de recherche par défaut."""
        try:
            # Définir les catégories par défaut
            default_categories = [
                ('technical_skills', 'Compétences techniques'),
                ('job_titles', 'Titres de poste'),
                ('industries', 'Industries et secteurs d\'activité'),
                ('locations', 'Localisations géographiques'),
                ('contract_types', 'Types de contrat'),
                ('seniority_levels', 'Niveaux d\'expérience'),
                ('company_sizes', 'Tailles d\'entreprise'),
                ('keywords', 'Mots-clés généraux')
            ]
            
            # Insérer les catégories
            self.cursor.executemany("""
            INSERT INTO search_categories (name, description)
            VALUES (?, ?)
            """, default_categories)
            
            self.conn.commit()
            
            logger.info(f"{len(default_categories)} catégories par défaut créées")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des catégories par défaut: {e}")
            self.conn.rollback()

    def _create_default_preferences(self) -> None:
        """Crée un ensemble de préférences par défaut pour l'utilisateur."""
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.warning("Aucun profil utilisateur trouvé, création d'un profil par défaut")
                
                # Créer un profil utilisateur par défaut
                self.cursor.execute("""
                INSERT INTO user_profile (name, email, title, summary)
                VALUES (?, ?, ?, ?)
                """, ("Utilisateur", "utilisateur@example.com", "Chercheur d'emploi", "Profil par défaut"))
                
                user_id = self.cursor.lastrowid
            else:
                user_id = user_id_result[0]
            
            # Créer un ensemble de préférences par défaut
            self.cursor.execute("""
            INSERT INTO search_preferences (user_id, name, is_active)
            VALUES (?, ?, ?)
            """, (user_id, "Préférences par défaut", 1))
            
            preference_id = self.cursor.lastrowid
            
            # Ajouter quelques mots-clés par défaut
            default_keywords = []
            
            # Récupérer l'ID de la catégorie "Types de contrat"
            self.cursor.execute("""
            SELECT id FROM search_categories WHERE name = 'contract_types'
            """)
            
            contract_types_id = self.cursor.fetchone()[0]
            
            # Ajouter des types de contrat par défaut
            default_keywords.extend([
                (preference_id, contract_types_id, "CDI", 1.0),
                (preference_id, contract_types_id, "CDD", 0.8),
                (preference_id, contract_types_id, "Freelance", 0.6)
            ])
            
            # Insérer les mots-clés par défaut
            if default_keywords:
                self.cursor.executemany("""
                INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
                VALUES (?, ?, ?, ?)
                """, default_keywords)
            
            self.conn.commit()
            
            logger.info(f"Ensemble de préférences par défaut créé avec {len(default_keywords)} mots-clés")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des préférences par défaut: {e}")
            self.conn.rollback()

    def get_search_categories(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des catégories de recherche.
        
        Returns:
            Liste des catégories
        """
        try:
            self.cursor.execute("""
            SELECT id, name, description 
            FROM search_categories 
            ORDER BY id
            """)
            
            categories = self.cursor.fetchall()
            
            return [
                {
                    "id": cat[0],
                    "name": cat[1],
                    "description": cat[2]
                }
                for cat in categories
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des catégories: {e}")
            return []

    def get_search_preferences(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Récupère la liste des ensembles de préférences de recherche.
        
        Args:
            active_only: Si True, récupère uniquement les ensembles actifs
            
        Returns:
            Liste des ensembles de préférences
        """
        try:
            query = """
            SELECT id, user_id, name, is_active 
            FROM search_preferences 
            """
            
            if active_only:
                query += "WHERE is_active = 1 "
                
            query += "ORDER BY is_active DESC, name"
            
            self.cursor.execute(query)
            
            preferences = self.cursor.fetchall()
            
            return [
                {
                    "id": pref[0],
                    "user_id": pref[1],
                    "name": pref[2],
                    "is_active": bool(pref[3])
                }
                for pref in preferences
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des préférences: {e}")
            return []

    def get_search_keywords(self, preference_id: int = None, category_id: int = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des mots-clés de recherche.
        
        Args:
            preference_id: ID de l'ensemble de préférences (si None, tous les ensembles)
            category_id: ID de la catégorie (si None, toutes les catégories)
            
        Returns:
            Liste des mots-clés
        """
        try:
            query = """
            SELECT k.id, k.preference_id, p.name as preference_name, 
                   k.category_id, c.name as category_name, 
                   k.keyword, k.weight 
            FROM search_keywords k
            JOIN search_preferences p ON k.preference_id = p.id
            JOIN search_categories c ON k.category_id = c.id
            WHERE 1=1
            """
            
            params = []
            
            if preference_id is not None:
                query += " AND k.preference_id = ?"
                params.append(preference_id)
                
            if category_id is not None:
                query += " AND k.category_id = ?"
                params.append(category_id)
                
            query += " ORDER BY p.is_active DESC, c.name, k.weight DESC, k.keyword"
            
            self.cursor.execute(query, params)
            
            keywords = self.cursor.fetchall()
            
            return [
                {
                    "id": kw[0],
                    "preference_id": kw[1],
                    "preference_name": kw[2],
                    "category_id": kw[3],
                    "category_name": kw[4],
                    "keyword": kw[5],
                    "weight": kw[6]
                }
                for kw in keywords
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des mots-clés: {e}")
            return []

    def get_search_suggestions(self, user_id: int = None, category_id: int = None, applied_only: bool = False) -> List[Dict[str, Any]]:
        """
        Récupère la liste des suggestions de recherche.
        
        Args:
            user_id: ID de l'utilisateur (si None, tous les utilisateurs)
            category_id: ID de la catégorie (si None, toutes les catégories)
            applied_only: Si True, récupère uniquement les suggestions appliquées
            
        Returns:
            Liste des suggestions
        """
        try:
            query = """
            SELECT s.id, s.user_id, s.category_id, c.name as category_name, 
                   s.keyword, s.weight, s.reason, s.is_applied 
            FROM search_suggestions s
            JOIN search_categories c ON s.category_id = c.id
            WHERE 1=1
            """
            
            params = []
            
            if user_id is not None:
                query += " AND s.user_id = ?"
                params.append(user_id)
                
            if category_id is not None:
                query += " AND s.category_id = ?"
                params.append(category_id)
                
            if applied_only:
                query += " AND s.is_applied = 1"
                
            query += " ORDER BY s.is_applied DESC, c.name, s.weight DESC, s.keyword"
            
            self.cursor.execute(query, params)
            
            suggestions = self.cursor.fetchall()
            
            return [
                {
                    "id": sugg[0],
                    "user_id": sugg[1],
                    "category_id": sugg[2],
                    "category_name": sugg[3],
                    "keyword": sugg[4],
                    "weight": sugg[5],
                    "reason": sugg[6],
                    "is_applied": bool(sugg[7])
                }
                for sugg in suggestions
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des suggestions: {e}")
            return []

    def add_search_preference(self, name: str, is_active: bool = True) -> int:
        """
        Ajoute un nouvel ensemble de préférences de recherche.
        
        Args:
            name: Nom de l'ensemble de préférences
            is_active: Si True, cet ensemble est actif
            
        Returns:
            ID du nouvel ensemble de préférences
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return -1
                
            user_id = user_id_result[0]
            
            # Si cet ensemble doit être actif, désactiver les autres
            if is_active:
                self.cursor.execute("""
                UPDATE search_preferences 
                SET is_active = 0 
                WHERE user_id = ?
                """, (user_id,))
            
            # Insérer le nouvel ensemble de préférences
            self.cursor.execute("""
            INSERT INTO search_preferences (user_id, name, is_active)
            VALUES (?, ?, ?)
            """, (user_id, name, is_active))
            
            preference_id = self.cursor.lastrowid
            
            self.conn.commit()
            
            logger.info(f"Nouvel ensemble de préférences ajouté: {name}")
            
            return preference_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout de l'ensemble de préférences: {e}")
            self.conn.rollback()
            return -1

    def update_search_preference(self, preference_id: int, name: str = None, is_active: bool = None) -> bool:
        """
        Met à jour un ensemble de préférences existant.
        
        Args:
            preference_id: ID de l'ensemble de préférences à mettre à jour
            name: Nouveau nom (si None, conserve l'ancien)
            is_active: Nouveau statut actif (si None, conserve l'ancien)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si l'ensemble de préférences existe
            self.cursor.execute("""
            SELECT id, user_id, name, is_active 
            FROM search_preferences 
            WHERE id = ?
            """, (preference_id,))
            
            preference = self.cursor.fetchone()
            
            if not preference:
                logger.error(f"Ensemble de préférences avec ID {preference_id} non trouvé")
                return False
                
            # Préparer les valeurs à mettre à jour
            update_name = name if name is not None else preference[2]
            update_is_active = is_active if is_active is not None else bool(preference[3])
            
            # Si cet ensemble doit être actif, désactiver les autres
            if update_is_active and not bool(preference[3]):
                self.cursor.execute("""
                UPDATE search_preferences 
                SET is_active = 0 
                WHERE user_id = ?
                """, (preference[1],))
            
            # Mettre à jour l'ensemble de préférences
            self.cursor.execute("""
            UPDATE search_preferences 
            SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (update_name, update_is_active, preference_id))
            
            self.conn.commit()
            
            logger.info(f"Ensemble de préférences mis à jour: {update_name}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour de l'ensemble de préférences: {e}")
            self.conn.rollback()
            return False

    def delete_search_preference(self, preference_id: int) -> bool:
        """
        Supprime un ensemble de préférences existant.
        
        Args:
            preference_id: ID de l'ensemble de préférences à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si l'ensemble de préférences existe
            self.cursor.execute("""
            SELECT id, is_active 
            FROM search_preferences 
            WHERE id = ?
            """, (preference_id,))
            
            preference = self.cursor.fetchone()
            
            if not preference:
                logger.error(f"Ensemble de préférences avec ID {preference_id} non trouvé")
                return False
                
            # Empêcher la suppression du dernier ensemble de préférences actif
            if bool(preference[1]):
                # Vérifier s'il y a d'autres ensembles de préférences
                self.cursor.execute("SELECT COUNT(*) FROM search_preferences")
                count = self.cursor.fetchone()[0]
                
                if count <= 1:
                    logger.error("Impossible de supprimer le dernier ensemble de préférences")
                    return False
                    
                # Activer un autre ensemble de préférences
                self.cursor.execute("""
                UPDATE search_preferences 
                SET is_active = 1 
                WHERE id != ? 
                LIMIT 1
                """, (preference_id,))
            
            # Supprimer les mots-clés associés
            self.cursor.execute("""
            DELETE FROM search_keywords 
            WHERE preference_id = ?
            """, (preference_id,))
            
            # Supprimer l'ensemble de préférences
            self.cursor.execute("""
            DELETE FROM search_preferences 
            WHERE id = ?
            """, (preference_id,))
            
            self.conn.commit()
            
            logger.info(f"Ensemble de préférences avec ID {preference_id} supprimé")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression de l'ensemble de préférences: {e}")
            self.conn.rollback()
            return False

    def add_search_keyword(self, preference_id: int, category_id: int, keyword: str, weight: float = 1.0) -> int:
        """
        Ajoute un nouveau mot-clé de recherche.
        
        Args:
            preference_id: ID de l'ensemble de préférences
            category_id: ID de la catégorie
            keyword: Mot-clé
            weight: Pondération (entre 0.0 et 1.0)
            
        Returns:
            ID du nouveau mot-clé
        """
        try:
            # Vérifier si l'ensemble de préférences existe
            self.cursor.execute("""
            SELECT id FROM search_preferences WHERE id = ?
            """, (preference_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Ensemble de préférences avec ID {preference_id} non trouvé")
                return -1
                
            # Vérifier si la catégorie existe
            self.cursor.execute("""
            SELECT id FROM search_categories WHERE id = ?
            """, (category_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Catégorie avec ID {category_id} non trouvée")
                return -1
                
            # Limiter la pondération entre 0.0 et 1.0
            weight = max(0.0, min(1.0, weight))
            
            # Vérifier si le mot-clé existe déjà
            self.cursor.execute("""
            SELECT id FROM search_keywords 
            WHERE preference_id = ? AND category_id = ? AND keyword = ?
            """, (preference_id, category_id, keyword))
            
            existing_keyword = self.cursor.fetchone()
            
            if existing_keyword:
                # Mettre à jour la pondération
                self.cursor.execute("""
                UPDATE search_keywords 
                SET weight = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (weight, existing_keyword[0]))
                
                self.conn.commit()
                
                logger.info(f"Mot-clé existant mis à jour: {keyword} (pondération: {weight})")
                
                return existing_keyword[0]
            
            # Insérer le nouveau mot-clé
            self.cursor.execute("""
            INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
            VALUES (?, ?, ?, ?)
            """, (preference_id, category_id, keyword, weight))
            
            keyword_id = self.cursor.lastrowid
            
            self.conn.commit()
            
            logger.info(f"Nouveau mot-clé ajouté: {keyword} (pondération: {weight})")
            
            return keyword_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout du mot-clé: {e}")
            self.conn.rollback()
            return -1

    def update_search_keyword(self, keyword_id: int, keyword: str = None, weight: float = None) -> bool:
        """
        Met à jour un mot-clé existant.
        
        Args:
            keyword_id: ID du mot-clé à mettre à jour
            keyword: Nouveau mot-clé (si None, conserve l'ancien)
            weight: Nouvelle pondération (si None, conserve l'ancienne)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si le mot-clé existe
            self.cursor.execute("""
            SELECT id, keyword, weight 
            FROM search_keywords 
            WHERE id = ?
            """, (keyword_id,))
            
            keyword_data = self.cursor.fetchone()
            
            if not keyword_data:
                logger.error(f"Mot-clé avec ID {keyword_id} non trouvé")
                return False
                
            # Préparer les valeurs à mettre à jour
            update_keyword = keyword if keyword is not None else keyword_data[1]
            update_weight = weight if weight is not None else keyword_data[2]
            
            # Limiter la pondération entre 0.0 et 1.0
            update_weight = max(0.0, min(1.0, update_weight))
            
            # Mettre à jour le mot-clé
            self.cursor.execute("""
            UPDATE search_keywords 
            SET keyword = ?, weight = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (update_keyword, update_weight, keyword_id))
            
            self.conn.commit()
            
            logger.info(f"Mot-clé mis à jour: {update_keyword} (pondération: {update_weight})")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour du mot-clé: {e}")
            self.conn.rollback()
            return False

    def delete_search_keyword(self, keyword_id: int) -> bool:
        """
        Supprime un mot-clé existant.
        
        Args:
            keyword_id: ID du mot-clé à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si le mot-clé existe
            self.cursor.execute("""
            SELECT id FROM search_keywords WHERE id = ?
            """, (keyword_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Mot-clé avec ID {keyword_id} non trouvé")
                return False
                
            # Supprimer le mot-clé
            self.cursor.execute("""
            DELETE FROM search_keywords WHERE id = ?
            """, (keyword_id,))
            
            self.conn.commit()
            
            logger.info(f"Mot-clé avec ID {keyword_id} supprimé")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression du mot-clé: {e}")
            self.conn.rollback()
            return False

    def add_search_suggestion(self, category_id: int, keyword: str, weight: float = 1.0, reason: str = None) -> int:
        """
        Ajoute une nouvelle suggestion de recherche.
        
        Args:
            category_id: ID de la catégorie
            keyword: Mot-clé
            weight: Pondération (entre 0.0 et 1.0)
            reason: Raison de la suggestion
            
        Returns:
            ID de la nouvelle suggestion
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return -1
                
            user_id = user_id_result[0]
            
            # Vérifier si la catégorie existe
            self.cursor.execute("""
            SELECT id FROM search_categories WHERE id = ?
            """, (category_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Catégorie avec ID {category_id} non trouvée")
                return -1
                
            # Limiter la pondération entre 0.0 et 1.0
            weight = max(0.0, min(1.0, weight))
            
            # Vérifier si la suggestion existe déjà
            self.cursor.execute("""
            SELECT id FROM search_suggestions 
            WHERE user_id = ? AND category_id = ? AND keyword = ?
            """, (user_id, category_id, keyword))
            
            existing_suggestion = self.cursor.fetchone()
            
            if existing_suggestion:
                # Mettre à jour la suggestion
                self.cursor.execute("""
                UPDATE search_suggestions 
                SET weight = ?, reason = ?
                WHERE id = ?
                """, (weight, reason, existing_suggestion[0]))
                
                self.conn.commit()
                
                logger.info(f"Suggestion existante mise à jour: {keyword} (pondération: {weight})")
                
                return existing_suggestion[0]
            
            # Insérer la nouvelle suggestion
            self.cursor.execute("""
            INSERT INTO search_suggestions (user_id, category_id, keyword, weight, reason)
            VALUES (?, ?, ?, ?, ?)
            """, (user_id, category_id, keyword, weight, reason))
            
            suggestion_id = self.cursor.lastrowid
            
            self.conn.commit()
            
            logger.info(f"Nouvelle suggestion ajoutée: {keyword} (pondération: {weight})")
            
            return suggestion_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout de la suggestion: {e}")
            self.conn.rollback()
            return -1

    def apply_search_suggestion(self, suggestion_id: int) -> bool:
        """
        Applique une suggestion de recherche en l'ajoutant aux mots-clés actifs.
        
        Args:
            suggestion_id: ID de la suggestion à appliquer
            
        Returns:
            True si l'application a réussi, False sinon
        """
        try:
            # Vérifier si la suggestion existe
            self.cursor.execute("""
            SELECT id, user_id, category_id, keyword, weight, is_applied 
            FROM search_suggestions 
            WHERE id = ?
            """, (suggestion_id,))
            
            suggestion = self.cursor.fetchone()
            
            if not suggestion:
                logger.error(f"Suggestion avec ID {suggestion_id} non trouvée")
                return False
                
            # Si la suggestion est déjà appliquée, ne rien faire
            if bool(suggestion[5]):
                logger.info(f"Suggestion avec ID {suggestion_id} déjà appliquée")
                return True
                
            # Récupérer l'ensemble de préférences actif
            self.cursor.execute("""
            SELECT id FROM search_preferences 
            WHERE user_id = ? AND is_active = 1
            LIMIT 1
            """, (suggestion[1],))
            
            preference_result = self.cursor.fetchone()
            
            if not preference_result:
                logger.error("Aucun ensemble de préférences actif trouvé")
                return False
                
            preference_id = preference_result[0]
            
            # Ajouter le mot-clé à l'ensemble de préférences actif
            self.cursor.execute("""
            INSERT INTO search_keywords (preference_id, category_id, keyword, weight)
            VALUES (?, ?, ?, ?)
            """, (preference_id, suggestion[2], suggestion[3], suggestion[4]))
            
            # Marquer la suggestion comme appliquée
            self.cursor.execute("""
            UPDATE search_suggestions 
            SET is_applied = 1
            WHERE id = ?
            """, (suggestion_id,))
            
            self.conn.commit()
            
            logger.info(f"Suggestion avec ID {suggestion_id} appliquée")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'application de la suggestion: {e}")
            self.conn.rollback()
            return False

    def delete_search_suggestion(self, suggestion_id: int) -> bool:
        """
        Supprime une suggestion existante.
        
        Args:
            suggestion_id: ID de la suggestion à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si la suggestion existe
            self.cursor.execute("""
            SELECT id FROM search_suggestions WHERE id = ?
            """, (suggestion_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Suggestion avec ID {suggestion_id} non trouvée")
                return False
                
            # Supprimer la suggestion
            self.cursor.execute("""
            DELETE FROM search_suggestions WHERE id = ?
            """, (suggestion_id,))
            
            self.conn.commit()
            
            logger.info(f"Suggestion avec ID {suggestion_id} supprimée")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression de la suggestion: {e}")
            self.conn.rollback()
            return False

    def generate_search_query(self, preference_id: int = None, category_id: int = None, max_keywords: int = 5) -> str:
        """
        Génère une requête de recherche basée sur les mots-clés pondérés.
        
        Args:
            preference_id: ID de l'ensemble de préférences (si None, utilise l'ensemble actif)
            category_id: ID de la catégorie (si None, utilise toutes les catégories)
            max_keywords: Nombre maximum de mots-clés à inclure
            
        Returns:
            Requête de recherche
        """
        try:
            # Si preference_id n'est pas spécifié, utiliser l'ensemble actif
            if preference_id is None:
                self.cursor.execute("""
                SELECT id FROM search_preferences 
                WHERE is_active = 1
                LIMIT 1
                """)
                
                preference_result = self.cursor.fetchone()
                
                if not preference_result:
                    logger.error("Aucun ensemble de préférences actif trouvé")
                    return ""
                    
                preference_id = preference_result[0]
            
            # Récupérer les mots-clés pondérés
            query = """
            SELECT keyword, weight 
            FROM search_keywords 
            WHERE preference_id = ?
            """
            
            params = [preference_id]
            
            if category_id is not None:
                query += " AND category_id = ?"
                params.append(category_id)
                
            query += " ORDER BY weight DESC, keyword"
            
            self.cursor.execute(query, params)
            
            keywords = self.cursor.fetchall()
            
            # Sélectionner les mots-clés avec les pondérations les plus élevées
            selected_keywords = [kw[0] for kw in keywords[:max_keywords]]
            
            # Construire la requête de recherche
            search_query = " ".join(selected_keywords)
            
            logger.info(f"Requête de recherche générée: {search_query}")
            
            return search_query
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la génération de la requête de recherche: {e}")
            return ""

    def generate_search_queries_by_category(self, preference_id: int = None, max_keywords_per_category: int = 3) -> Dict[str, str]:
        """
        Génère des requêtes de recherche par catégorie.
        
        Args:
            preference_id: ID de l'ensemble de préférences (si None, utilise l'ensemble actif)
            max_keywords_per_category: Nombre maximum de mots-clés par catégorie
            
        Returns:
            Dictionnaire des requêtes de recherche par catégorie
        """
        try:
            # Si preference_id n'est pas spécifié, utiliser l'ensemble actif
            if preference_id is None:
                self.cursor.execute("""
                SELECT id FROM search_preferences 
                WHERE is_active = 1
                LIMIT 1
                """)
                
                preference_result = self.cursor.fetchone()
                
                if not preference_result:
                    logger.error("Aucun ensemble de préférences actif trouvé")
                    return {}
                    
                preference_id = preference_result[0]
            
            # Récupérer les catégories
            self.cursor.execute("""
            SELECT id, name FROM search_categories
            """)
            
            categories = self.cursor.fetchall()
            
            # Générer une requête pour chaque catégorie
            search_queries = {}
            
            for category_id, category_name in categories:
                query = self.generate_search_query(preference_id, category_id, max_keywords_per_category)
                if query:
                    search_queries[category_name] = query
            
            return search_queries
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la génération des requêtes de recherche par catégorie: {e}")
            return {}

    def import_keywords_from_cv(self, cv_data: Dict[str, Any]) -> int:
        """
        Importe des mots-clés à partir des données d'un CV.
        
        Args:
            cv_data: Dictionnaire contenant les données du CV
            
        Returns:
            Nombre de mots-clés importés
        """
        try:
            # Récupérer l'ensemble de préférences actif
            self.cursor.execute("""
            SELECT id FROM search_preferences 
            WHERE is_active = 1
            LIMIT 1
            """)
            
            preference_result = self.cursor.fetchone()
            
            if not preference_result:
                logger.error("Aucun ensemble de préférences actif trouvé")
                return 0
                
            preference_id = preference_result[0]
            
            # Récupérer les IDs des catégories
            category_ids = {}
            self.cursor.execute("SELECT id, name FROM search_categories")
            for cat_id, cat_name in self.cursor.fetchall():
                category_ids[cat_name] = cat_id
            
            # Compter les mots-clés importés
            imported_count = 0
            
            # Importer les compétences techniques
            if 'technical_skills' in cv_data and category_ids.get('technical_skills'):
                for skill in cv_data['technical_skills']:
                    # Déterminer la pondération (par défaut 0.7)
                    weight = 0.7
                    
                    # Ajouter le mot-clé
                    keyword_id = self.add_search_keyword(
                        preference_id, 
                        category_ids['technical_skills'], 
                        skill, 
                        weight
                    )
                    
                    if keyword_id > 0:
                        imported_count += 1
            
            # Importer les titres de poste
            if 'experiences' in cv_data and category_ids.get('job_titles'):
                for i, exp in enumerate(cv_data.get('experiences', [])):
                    if 'position' in exp:
                        # Pondération décroissante selon l'ancienneté (supposant que les expériences sont triées par ordre chronologique inverse)
                        weight = 1.0 - (i * 0.1)
                        weight = max(0.6, weight)  # Garantir une pondération minimale de 0.6
                        
                        # Ajouter le mot-clé
                        keyword_id = self.add_search_keyword(
                            preference_id, 
                            category_ids['job_titles'], 
                            exp['position'], 
                            weight
                        )
                        
                        if keyword_id > 0:
                            imported_count += 1
            
            # Importer les industries
            if 'experiences' in cv_data and category_ids.get('industries'):
                industries = set()
                for exp in cv_data.get('experiences', []):
                    if 'company' in exp:
                        industries.add(exp['company'])
                
                for industry in industries:
                    # Ajouter le mot-clé
                    keyword_id = self.add_search_keyword(
                        preference_id, 
                        category_ids['industries'], 
                        industry, 
                        0.8
                    )
                    
                    if keyword_id > 0:
                        imported_count += 1
            
            # Importer les localisations
            if 'location' in cv_data and category_ids.get('locations'):
                # Ajouter le mot-clé
                keyword_id = self.add_search_keyword(
                    preference_id, 
                    category_ids['locations'], 
                    cv_data['location'], 
                    0.9
                )
                
                if keyword_id > 0:
                    imported_count += 1
            
            self.conn.commit()
            
            logger.info(f"{imported_count} mots-clés importés depuis le CV")
            
            return imported_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'importation des mots-clés depuis le CV: {e}")
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
    import json
    
    parser = argparse.ArgumentParser(description='Gestionnaire de préférences de recherche')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--list-categories', help='Lister les catégories', action='store_true')
    parser.add_argument('--list-preferences', help='Lister les ensembles de préférences', action='store_true')
    parser.add_argument('--list-keywords', help='Lister les mots-clés', action='store_true')
    parser.add_argument('--list-suggestions', help='Lister les suggestions', action='store_true')
    parser.add_argument('--preference', help='ID de l\'ensemble de préférences', type=int)
    parser.add_argument('--category', help='ID de la catégorie', type=int)
    parser.add_argument('--add-preference', help='Ajouter un ensemble de préférences', action='store_true')
    parser.add_argument('--add-keyword', help='Ajouter un mot-clé', action='store_true')
    parser.add_argument('--add-suggestion', help='Ajouter une suggestion', action='store_true')
    parser.add_argument('--apply-suggestion', help='Appliquer une suggestion', type=int)
    parser.add_argument('--name', help='Nom')
    parser.add_argument('--keyword', help='Mot-clé')
    parser.add_argument('--weight', help='Pondération', type=float, default=1.0)
    parser.add_argument('--reason', help='Raison de la suggestion')
    parser.add_argument('--active', help='Définir comme actif', action='store_true')
    parser.add_argument('--generate-query', help='Générer une requête de recherche', action='store_true')
    parser.add_argument('--max-keywords', help='Nombre maximum de mots-clés', type=int, default=5)
    parser.add_argument('--import-cv', help='Importer des mots-clés depuis un fichier JSON de CV')
    
    args = parser.parse_args()
    
    # Initialiser le gestionnaire de préférences
    preferences_manager = SearchPreferencesManager(args.db)
    
    if args.list_categories:
        # Lister les catégories
        categories = preferences_manager.get_search_categories()
        print(f"{len(categories)} catégories configurées:")
        for cat in categories:
            print(f"  - ID {cat['id']}: {cat['name']} ({cat['description']})")
    
    elif args.list_preferences:
        # Lister les ensembles de préférences
        preferences = preferences_manager.get_search_preferences()
        print(f"{len(preferences)} ensembles de préférences configurés:")
        for pref in preferences:
            active = " (Actif)" if pref["is_active"] else ""
            print(f"  - ID {pref['id']}: {pref['name']}{active}")
    
    elif args.list_keywords:
        # Lister les mots-clés
        keywords = preferences_manager.get_search_keywords(args.preference, args.category)
        print(f"{len(keywords)} mots-clés configurés:")
        
        current_category = None
        for kw in keywords:
            if current_category != kw['category_name']:
                current_category = kw['category_name']
                print(f"\n  {current_category}:")
                
            print(f"    - ID {kw['id']}: {kw['keyword']} (pondération: {kw['weight']})")
    
    elif args.list_suggestions:
        # Lister les suggestions
        suggestions = preferences_manager.get_search_suggestions()
        print(f"{len(suggestions)} suggestions configurées:")
        
        current_category = None
        for sugg in suggestions:
            if current_category != sugg['category_name']:
                current_category = sugg['category_name']
                print(f"\n  {current_category}:")
                
            applied = " (Appliquée)" if sugg["is_applied"] else ""
            reason = f" - {sugg['reason']}" if sugg['reason'] else ""
            print(f"    - ID {sugg['id']}: {sugg['keyword']} (pondération: {sugg['weight']}){applied}{reason}")
    
    elif args.add_preference:
        # Ajouter un ensemble de préférences
        if not args.name:
            print("Erreur: --name est requis pour ajouter un ensemble de préférences")
        else:
            preference_id = preferences_manager.add_search_preference(args.name, args.active)
            if preference_id > 0:
                print(f"Ensemble de préférences ajouté avec ID {preference_id}")
            else:
                print("Erreur lors de l'ajout de l'ensemble de préférences")
    
    elif args.add_keyword:
        # Ajouter un mot-clé
        if not args.preference or not args.category or not args.keyword:
            print("Erreur: --preference, --category et --keyword sont requis pour ajouter un mot-clé")
        else:
            keyword_id = preferences_manager.add_search_keyword(args.preference, args.category, args.keyword, args.weight)
            if keyword_id > 0:
                print(f"Mot-clé ajouté avec ID {keyword_id}")
            else:
                print("Erreur lors de l'ajout du mot-clé")
    
    elif args.add_suggestion:
        # Ajouter une suggestion
        if not args.category or not args.keyword:
            print("Erreur: --category et --keyword sont requis pour ajouter une suggestion")
        else:
            suggestion_id = preferences_manager.add_search_suggestion(args.category, args.keyword, args.weight, args.reason)
            if suggestion_id > 0:
                print(f"Suggestion ajoutée avec ID {suggestion_id}")
            else:
                print("Erreur lors de l'ajout de la suggestion")
    
    elif args.apply_suggestion:
        # Appliquer une suggestion
        success = preferences_manager.apply_search_suggestion(args.apply_suggestion)
        if success:
            print(f"Suggestion avec ID {args.apply_suggestion} appliquée")
        else:
            print(f"Erreur lors de l'application de la suggestion avec ID {args.apply_suggestion}")
    
    elif args.generate_query:
        # Générer une requête de recherche
        if args.category:
            query = preferences_manager.generate_search_query(args.preference, args.category, args.max_keywords)
            print(f"Requête de recherche générée: {query}")
        else:
            queries = preferences_manager.generate_search_queries_by_category(args.preference, args.max_keywords)
            print("Requêtes de recherche générées par catégorie:")
            for category, query in queries.items():
                print(f"  - {category}: {query}")
    
    elif args.import_cv:
        # Importer des mots-clés depuis un fichier JSON de CV
        try:
            with open(args.import_cv, 'r') as f:
                cv_data = json.load(f)
                
            imported_count = preferences_manager.import_keywords_from_cv(cv_data)
            print(f"{imported_count} mots-clés importés depuis le CV")
            
        except Exception as e:
            print(f"Erreur lors de l'importation des mots-clés depuis le CV: {e}")
    
    else:
        # Afficher l'aide
        parser.print_help()
    
    # Fermer la connexion
    preferences_manager.close()
