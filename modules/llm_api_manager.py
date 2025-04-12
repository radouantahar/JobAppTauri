#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de gestion des API LLM pour l'application d'automatisation de recherche d'emploi
Ce module permet de gérer différentes API LLM (locales et distantes) et de choisir automatiquement
la plus appropriée selon les besoins et la disponibilité.
"""

import os
import json
import logging
import sqlite3
import requests
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import subprocess

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LLMApiManager:
    """
    Classe pour gérer les API LLM (locales et distantes) et choisir automatiquement
    la plus appropriée selon les besoins et la disponibilité.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du gestionnaire d'API LLM.
        
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
                'api_providers',
                'api_usage',
                'api_models'
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
            if 'api_providers' not in existing_tables:
                logger.info("Création de la table api_providers")
                
                self.cursor.execute("""
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
                """)
                
                # Ajouter Ollama comme fournisseur par défaut
                self._add_default_providers()
            
            if 'api_usage' not in existing_tables:
                logger.info("Création de la table api_usage")
                
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider_id INTEGER NOT NULL,
                    operation_type TEXT NOT NULL,
                    tokens_used INTEGER NOT NULL,
                    estimated_cost REAL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE
                )
                """)
                
                # Créer un index pour accélérer les recherches
                self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_api_usage_provider 
                ON api_usage(provider_id)
                """)
            
            if 'api_models' not in existing_tables:
                logger.info("Création de la table api_models")
                
                self.cursor.execute("""
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
                """)
                
                # Créer un index pour accélérer les recherches
                self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_api_models_provider 
                ON api_models(provider_id)
                """)
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la vérification/création des tables: {e}")
            self.conn.rollback()
            raise

    def _add_default_providers(self) -> None:
        """Ajoute les fournisseurs d'API par défaut."""
        try:
            # Ajouter Ollama comme fournisseur par défaut
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Ollama Local", 
                "local", 
                "http://localhost:11434", 
                json.dumps(["llama3:8b", "llama3:70b", "mistral:7b", "gemma:7b"]), 
                1, 
                10,  # Priorité élevée pour l'API locale
                0.0   # Coût nul pour l'API locale
            ))
            
            # Ajouter OpenAI comme fournisseur alternatif (désactivé par défaut)
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "OpenAI API", 
                "openai", 
                "https://api.openai.com/v1", 
                json.dumps(["gpt-3.5-turbo", "gpt-4"]), 
                0,  # Désactivé par défaut
                5,  # Priorité moyenne
                0.002  # Coût approximatif
            ))
            
            # Ajouter Mistral AI comme fournisseur alternatif (désactivé par défaut)
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Mistral AI", 
                "mistral", 
                "https://api.mistral.ai/v1", 
                json.dumps(["mistral-tiny", "mistral-small", "mistral-medium"]), 
                0,  # Désactivé par défaut
                5,  # Priorité moyenne
                0.0014  # Coût approximatif
            ))
            
            # Ajouter Anthropic comme fournisseur alternatif (désactivé par défaut)
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Anthropic", 
                "anthropic", 
                "https://api.anthropic.com/v1", 
                json.dumps(["claude-instant-1", "claude-2"]), 
                0,  # Désactivé par défaut
                5,  # Priorité moyenne
                0.0025  # Coût approximatif
            ))
            
            # Ajouter Groq comme fournisseur alternatif (désactivé par défaut)
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, models, is_active, priority, cost_per_1k_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Groq", 
                "groq", 
                "https://api.groq.com/openai/v1", 
                json.dumps(["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"]), 
                0,  # Désactivé par défaut
                7,  # Priorité assez élevée (bon rapport qualité/prix)
                0.0005  # Coût très bas
            ))
            
            self.conn.commit()
            
            logger.info("Fournisseurs d'API par défaut ajoutés")
            
            # Ajouter les modèles pour chaque fournisseur
            self._add_default_models()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout des fournisseurs par défaut: {e}")
            self.conn.rollback()

    def _add_default_models(self) -> None:
        """Ajoute les modèles par défaut pour chaque fournisseur."""
        try:
            # Récupérer les fournisseurs
            self.cursor.execute("SELECT id, name, api_type FROM api_providers")
            providers = self.cursor.fetchall()
            
            for provider_id, provider_name, api_type in providers:
                if api_type == "local":
                    # Modèles Ollama
                    models = [
                        ("llama3:8b", "chat", 4096, 0.0, 0.0),
                        ("llama3:70b", "chat", 4096, 0.0, 0.0),
                        ("mistral:7b", "chat", 8192, 0.0, 0.0),
                        ("gemma:7b", "chat", 8192, 0.0, 0.0),
                        ("codellama:7b", "code", 4096, 0.0, 0.0),
                        ("phi3:14b", "chat", 4096, 0.0, 0.0)
                    ]
                elif api_type == "openai":
                    # Modèles OpenAI
                    models = [
                        ("gpt-3.5-turbo", "chat", 16385, 0.0015, 0.002),
                        ("gpt-4", "chat", 8192, 0.03, 0.06),
                        ("gpt-4-turbo", "chat", 128000, 0.01, 0.03)
                    ]
                elif api_type == "mistral":
                    # Modèles Mistral AI
                    models = [
                        ("mistral-tiny", "chat", 32768, 0.0014, 0.0014),
                        ("mistral-small", "chat", 32768, 0.006, 0.006),
                        ("mistral-medium", "chat", 32768, 0.027, 0.027)
                    ]
                elif api_type == "anthropic":
                    # Modèles Anthropic
                    models = [
                        ("claude-instant-1", "chat", 100000, 0.0008, 0.0024),
                        ("claude-2", "chat", 100000, 0.008, 0.024),
                        ("claude-3-opus", "chat", 200000, 0.015, 0.075),
                        ("claude-3-sonnet", "chat", 200000, 0.003, 0.015),
                        ("claude-3-haiku", "chat", 200000, 0.00025, 0.00125)
                    ]
                elif api_type == "groq":
                    # Modèles Groq
                    models = [
                        ("llama3-8b-8192", "chat", 8192, 0.0001, 0.0002),
                        ("llama3-70b-8192", "chat", 8192, 0.0003, 0.0006),
                        ("mixtral-8x7b-32768", "chat", 32768, 0.0002, 0.0004)
                    ]
                else:
                    continue
                
                # Ajouter les modèles
                for model_name, model_type, context_length, input_cost, output_cost in models:
                    self.cursor.execute("""
                    INSERT INTO api_models (
                        provider_id, model_name, model_type, context_length, 
                        cost_per_1k_input_tokens, cost_per_1k_output_tokens
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        provider_id, model_name, model_type, context_length, 
                        input_cost, output_cost
                    ))
            
            self.conn.commit()
            
            logger.info("Modèles par défaut ajoutés")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout des modèles par défaut: {e}")
            self.conn.rollback()

    def get_providers(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Récupère la liste des fournisseurs d'API.
        
        Args:
            active_only: Si True, récupère uniquement les fournisseurs actifs
            
        Returns:
            Liste des fournisseurs
        """
        try:
            query = """
            SELECT id, name, api_type, api_url, api_key, models, 
                   is_active, priority, cost_per_1k_tokens, 
                   monthly_quota, usage_this_month, 
                   created_at, updated_at 
            FROM api_providers 
            """
            
            if active_only:
                query += "WHERE is_active = 1 "
                
            query += "ORDER BY priority DESC, name"
            
            self.cursor.execute(query)
            
            providers = self.cursor.fetchall()
            
            return [
                {
                    "id": p[0],
                    "name": p[1],
                    "api_type": p[2],
                    "api_url": p[3],
                    "api_key": p[4],
                    "models": json.loads(p[5]) if p[5] else [],
                    "is_active": bool(p[6]),
                    "priority": p[7],
                    "cost_per_1k_tokens": p[8],
                    "monthly_quota": p[9],
                    "usage_this_month": p[10],
                    "created_at": p[11],
                    "updated_at": p[12]
                }
                for p in providers
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des fournisseurs: {e}")
            return []

    def get_provider(self, provider_id: int) -> Optional[Dict[str, Any]]:
        """
        Récupère un fournisseur d'API par son ID.
        
        Args:
            provider_id: ID du fournisseur
            
        Returns:
            Dictionnaire contenant les informations du fournisseur, ou None si non trouvé
        """
        try:
            self.cursor.execute("""
            SELECT id, name, api_type, api_url, api_key, models, 
                   is_active, priority, cost_per_1k_tokens, 
                   monthly_quota, usage_this_month, 
                   created_at, updated_at 
            FROM api_providers 
            WHERE id = ?
            """, (provider_id,))
            
            provider = self.cursor.fetchone()
            
            if not provider:
                return None
                
            return {
                "id": provider[0],
                "name": provider[1],
                "api_type": provider[2],
                "api_url": provider[3],
                "api_key": provider[4],
                "models": json.loads(provider[5]) if provider[5] else [],
                "is_active": bool(provider[6]),
                "priority": provider[7],
                "cost_per_1k_tokens": provider[8],
                "monthly_quota": provider[9],
                "usage_this_month": provider[10],
                "created_at": provider[11],
                "updated_at": provider[12]
            }
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération du fournisseur: {e}")
            return None

    def add_provider(self, name: str, api_type: str, api_url: str, api_key: str = None, 
                    models: List[str] = None, is_active: bool = True, 
                    priority: int = 0, cost_per_1k_tokens: float = 0.0,
                    monthly_quota: int = 0) -> int:
        """
        Ajoute un nouveau fournisseur d'API.
        
        Args:
            name: Nom du fournisseur
            api_type: Type d'API (local, openai, mistral, anthropic, groq, etc.)
            api_url: URL de l'API
            api_key: Clé d'API (si nécessaire)
            models: Liste des modèles disponibles
            is_active: Si True, le fournisseur est actif
            priority: Priorité du fournisseur (plus élevée = plus prioritaire)
            cost_per_1k_tokens: Coût moyen par 1000 tokens
            monthly_quota: Quota mensuel de tokens (0 = illimité)
            
        Returns:
            ID du nouveau fournisseur
        """
        try:
            # Vérifier si un fournisseur avec le même nom existe déjà
            self.cursor.execute("""
            SELECT id FROM api_providers WHERE name = ?
            """, (name,))
            
            if self.cursor.fetchone():
                logger.error(f"Un fournisseur avec le nom {name} existe déjà")
                return -1
            
            # Convertir la liste des modèles en JSON
            models_json = json.dumps(models) if models else json.dumps([])
            
            # Insérer le nouveau fournisseur
            self.cursor.execute("""
            INSERT INTO api_providers (
                name, api_type, api_url, api_key, models, 
                is_active, priority, cost_per_1k_tokens, monthly_quota
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                name, api_type, api_url, api_key, models_json, 
                is_active, priority, cost_per_1k_tokens, monthly_quota
            ))
            
            provider_id = self.cursor.lastrowid
            
            self.conn.commit()
            
            logger.info(f"Nouveau fournisseur ajouté: {name}")
            
            return provider_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout du fournisseur: {e}")
            self.conn.rollback()
            return -1

    def update_provider(self, provider_id: int, name: str = None, api_type: str = None, 
                       api_url: str = None, api_key: str = None, models: List[str] = None, 
                       is_active: bool = None, priority: int = None, 
                       cost_per_1k_tokens: float = None, monthly_quota: int = None) -> bool:
        """
        Met à jour un fournisseur existant.
        
        Args:
            provider_id: ID du fournisseur à mettre à jour
            name: Nouveau nom (si None, conserve l'ancien)
            api_type: Nouveau type d'API (si None, conserve l'ancien)
            api_url: Nouvelle URL (si None, conserve l'ancienne)
            api_key: Nouvelle clé d'API (si None, conserve l'ancienne)
            models: Nouvelle liste de modèles (si None, conserve l'ancienne)
            is_active: Nouveau statut actif (si None, conserve l'ancien)
            priority: Nouvelle priorité (si None, conserve l'ancienne)
            cost_per_1k_tokens: Nouveau coût (si None, conserve l'ancien)
            monthly_quota: Nouveau quota mensuel (si None, conserve l'ancien)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si le fournisseur existe
            self.cursor.execute("""
            SELECT id, name, api_type, api_url, api_key, models, 
                   is_active, priority, cost_per_1k_tokens, monthly_quota 
            FROM api_providers 
            WHERE id = ?
            """, (provider_id,))
            
            provider = self.cursor.fetchone()
            
            if not provider:
                logger.error(f"Fournisseur avec ID {provider_id} non trouvé")
                return False
                
            # Préparer les valeurs à mettre à jour
            update_name = name if name is not None else provider[1]
            update_api_type = api_type if api_type is not None else provider[2]
            update_api_url = api_url if api_url is not None else provider[3]
            update_api_key = api_key if api_key is not None else provider[4]
            update_models = json.dumps(models) if models is not None else provider[5]
            update_is_active = is_active if is_active is not None else bool(provider[6])
            update_priority = priority if priority is not None else provider[7]
            update_cost = cost_per_1k_tokens if cost_per_1k_tokens is not None else provider[8]
            update_quota = monthly_quota if monthly_quota is not None else provider[9]
            
            # Mettre à jour le fournisseur
            self.cursor.execute("""
            UPDATE api_providers 
            SET name = ?, api_type = ?, api_url = ?, api_key = ?, 
                models = ?, is_active = ?, priority = ?, 
                cost_per_1k_tokens = ?, monthly_quota = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (
                update_name, update_api_type, update_api_url, update_api_key, 
                update_models, update_is_active, update_priority, 
                update_cost, update_quota, provider_id
            ))
            
            self.conn.commit()
            
            logger.info(f"Fournisseur mis à jour: {update_name}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour du fournisseur: {e}")
            self.conn.rollback()
            return False

    def delete_provider(self, provider_id: int) -> bool:
        """
        Supprime un fournisseur existant.
        
        Args:
            provider_id: ID du fournisseur à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si le fournisseur existe
            self.cursor.execute("""
            SELECT id, name FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            provider = self.cursor.fetchone()
            
            if not provider:
                logger.error(f"Fournisseur avec ID {provider_id} non trouvé")
                return False
                
            # Supprimer les modèles associés
            self.cursor.execute("""
            DELETE FROM api_models WHERE provider_id = ?
            """, (provider_id,))
            
            # Supprimer l'utilisation associée
            self.cursor.execute("""
            DELETE FROM api_usage WHERE provider_id = ?
            """, (provider_id,))
            
            # Supprimer le fournisseur
            self.cursor.execute("""
            DELETE FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            self.conn.commit()
            
            logger.info(f"Fournisseur supprimé: {provider[1]}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression du fournisseur: {e}")
            self.conn.rollback()
            return False

    def get_models(self, provider_id: int = None, model_type: str = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des modèles.
        
        Args:
            provider_id: ID du fournisseur (si None, tous les fournisseurs)
            model_type: Type de modèle (si None, tous les types)
            
        Returns:
            Liste des modèles
        """
        try:
            query = """
            SELECT m.id, m.provider_id, p.name as provider_name, 
                   m.model_name, m.model_type, m.context_length, 
                   m.cost_per_1k_input_tokens, m.cost_per_1k_output_tokens, 
                   m.is_available, m.created_at, m.updated_at
            FROM api_models m
            JOIN api_providers p ON m.provider_id = p.id
            WHERE 1=1
            """
            
            params = []
            
            if provider_id is not None:
                query += " AND m.provider_id = ?"
                params.append(provider_id)
                
            if model_type is not None:
                query += " AND m.model_type = ?"
                params.append(model_type)
                
            query += " ORDER BY p.priority DESC, m.model_name"
            
            self.cursor.execute(query, params)
            
            models = self.cursor.fetchall()
            
            return [
                {
                    "id": m[0],
                    "provider_id": m[1],
                    "provider_name": m[2],
                    "model_name": m[3],
                    "model_type": m[4],
                    "context_length": m[5],
                    "cost_per_1k_input_tokens": m[6],
                    "cost_per_1k_output_tokens": m[7],
                    "is_available": bool(m[8]),
                    "created_at": m[9],
                    "updated_at": m[10]
                }
                for m in models
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des modèles: {e}")
            return []

    def add_model(self, provider_id: int, model_name: str, model_type: str, 
                 context_length: int = 4096, cost_per_1k_input_tokens: float = 0.0, 
                 cost_per_1k_output_tokens: float = 0.0, is_available: bool = True) -> int:
        """
        Ajoute un nouveau modèle.
        
        Args:
            provider_id: ID du fournisseur
            model_name: Nom du modèle
            model_type: Type de modèle (chat, code, etc.)
            context_length: Longueur de contexte maximale
            cost_per_1k_input_tokens: Coût par 1000 tokens d'entrée
            cost_per_1k_output_tokens: Coût par 1000 tokens de sortie
            is_available: Si True, le modèle est disponible
            
        Returns:
            ID du nouveau modèle
        """
        try:
            # Vérifier si le fournisseur existe
            self.cursor.execute("""
            SELECT id FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            if not self.cursor.fetchone():
                logger.error(f"Fournisseur avec ID {provider_id} non trouvé")
                return -1
                
            # Vérifier si le modèle existe déjà
            self.cursor.execute("""
            SELECT id FROM api_models 
            WHERE provider_id = ? AND model_name = ?
            """, (provider_id, model_name))
            
            if self.cursor.fetchone():
                logger.error(f"Un modèle avec le nom {model_name} existe déjà pour ce fournisseur")
                return -1
            
            # Insérer le nouveau modèle
            self.cursor.execute("""
            INSERT INTO api_models (
                provider_id, model_name, model_type, context_length, 
                cost_per_1k_input_tokens, cost_per_1k_output_tokens, is_available
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                provider_id, model_name, model_type, context_length, 
                cost_per_1k_input_tokens, cost_per_1k_output_tokens, is_available
            ))
            
            model_id = self.cursor.lastrowid
            
            # Mettre à jour la liste des modèles du fournisseur
            self.cursor.execute("""
            SELECT models FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            models_json = self.cursor.fetchone()[0]
            models = json.loads(models_json) if models_json else []
            
            if model_name not in models:
                models.append(model_name)
                
                self.cursor.execute("""
                UPDATE api_providers 
                SET models = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (json.dumps(models), provider_id))
            
            self.conn.commit()
            
            logger.info(f"Nouveau modèle ajouté: {model_name}")
            
            return model_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout du modèle: {e}")
            self.conn.rollback()
            return -1

    def update_model(self, model_id: int, model_name: str = None, model_type: str = None, 
                    context_length: int = None, cost_per_1k_input_tokens: float = None, 
                    cost_per_1k_output_tokens: float = None, is_available: bool = None) -> bool:
        """
        Met à jour un modèle existant.
        
        Args:
            model_id: ID du modèle à mettre à jour
            model_name: Nouveau nom (si None, conserve l'ancien)
            model_type: Nouveau type (si None, conserve l'ancien)
            context_length: Nouvelle longueur de contexte (si None, conserve l'ancienne)
            cost_per_1k_input_tokens: Nouveau coût d'entrée (si None, conserve l'ancien)
            cost_per_1k_output_tokens: Nouveau coût de sortie (si None, conserve l'ancien)
            is_available: Nouvelle disponibilité (si None, conserve l'ancienne)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si le modèle existe
            self.cursor.execute("""
            SELECT id, provider_id, model_name, model_type, context_length, 
                   cost_per_1k_input_tokens, cost_per_1k_output_tokens, is_available 
            FROM api_models 
            WHERE id = ?
            """, (model_id,))
            
            model = self.cursor.fetchone()
            
            if not model:
                logger.error(f"Modèle avec ID {model_id} non trouvé")
                return False
                
            # Préparer les valeurs à mettre à jour
            update_name = model_name if model_name is not None else model[2]
            update_type = model_type if model_type is not None else model[3]
            update_context = context_length if context_length is not None else model[4]
            update_input_cost = cost_per_1k_input_tokens if cost_per_1k_input_tokens is not None else model[5]
            update_output_cost = cost_per_1k_output_tokens if cost_per_1k_output_tokens is not None else model[6]
            update_available = is_available if is_available is not None else bool(model[7])
            
            # Mettre à jour le modèle
            self.cursor.execute("""
            UPDATE api_models 
            SET model_name = ?, model_type = ?, context_length = ?, 
                cost_per_1k_input_tokens = ?, cost_per_1k_output_tokens = ?, 
                is_available = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (
                update_name, update_type, update_context, 
                update_input_cost, update_output_cost, 
                update_available, model_id
            ))
            
            # Si le nom a changé, mettre à jour la liste des modèles du fournisseur
            if model_name is not None and model_name != model[2]:
                provider_id = model[1]
                old_name = model[2]
                
                self.cursor.execute("""
                SELECT models FROM api_providers WHERE id = ?
                """, (provider_id,))
                
                models_json = self.cursor.fetchone()[0]
                models = json.loads(models_json) if models_json else []
                
                if old_name in models:
                    models.remove(old_name)
                    
                if model_name not in models:
                    models.append(model_name)
                    
                self.cursor.execute("""
                UPDATE api_providers 
                SET models = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (json.dumps(models), provider_id))
            
            self.conn.commit()
            
            logger.info(f"Modèle mis à jour: {update_name}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour du modèle: {e}")
            self.conn.rollback()
            return False

    def delete_model(self, model_id: int) -> bool:
        """
        Supprime un modèle existant.
        
        Args:
            model_id: ID du modèle à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si le modèle existe
            self.cursor.execute("""
            SELECT id, provider_id, model_name FROM api_models WHERE id = ?
            """, (model_id,))
            
            model = self.cursor.fetchone()
            
            if not model:
                logger.error(f"Modèle avec ID {model_id} non trouvé")
                return False
                
            provider_id = model[1]
            model_name = model[2]
            
            # Supprimer le modèle
            self.cursor.execute("""
            DELETE FROM api_models WHERE id = ?
            """, (model_id,))
            
            # Mettre à jour la liste des modèles du fournisseur
            self.cursor.execute("""
            SELECT models FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            models_json = self.cursor.fetchone()[0]
            models = json.loads(models_json) if models_json else []
            
            if model_name in models:
                models.remove(model_name)
                
                self.cursor.execute("""
                UPDATE api_providers 
                SET models = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (json.dumps(models), provider_id))
            
            self.conn.commit()
            
            logger.info(f"Modèle supprimé: {model_name}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression du modèle: {e}")
            self.conn.rollback()
            return False

    def log_api_usage(self, provider_id: int, operation_type: str, tokens_used: int) -> bool:
        """
        Enregistre l'utilisation d'une API.
        
        Args:
            provider_id: ID du fournisseur
            operation_type: Type d'opération (suggestions, matching, etc.)
            tokens_used: Nombre de tokens utilisés
            
        Returns:
            True si l'enregistrement a réussi, False sinon
        """
        try:
            # Vérifier si le fournisseur existe
            self.cursor.execute("""
            SELECT id, cost_per_1k_tokens FROM api_providers WHERE id = ?
            """, (provider_id,))
            
            provider = self.cursor.fetchone()
            
            if not provider:
                logger.error(f"Fournisseur avec ID {provider_id} non trouvé")
                return False
                
            # Calculer le coût estimé
            cost_per_1k = provider[1] or 0.0
            estimated_cost = (tokens_used / 1000) * cost_per_1k
            
            # Enregistrer l'utilisation
            self.cursor.execute("""
            INSERT INTO api_usage (provider_id, operation_type, tokens_used, estimated_cost)
            VALUES (?, ?, ?, ?)
            """, (provider_id, operation_type, tokens_used, estimated_cost))
            
            # Mettre à jour l'utilisation mensuelle
            self.cursor.execute("""
            UPDATE api_providers 
            SET usage_this_month = usage_this_month + ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (tokens_used, provider_id))
            
            self.conn.commit()
            
            logger.info(f"Utilisation API enregistrée: {operation_type} - {tokens_used} tokens - {estimated_cost:.4f}€")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'enregistrement de l'utilisation: {e}")
            self.conn.rollback()
            return False

    def get_usage_stats(self, provider_id: int = None, days: int = 30) -> Dict[str, Any]:
        """
        Récupère les statistiques d'utilisation des API.
        
        Args:
            provider_id: ID du fournisseur (si None, tous les fournisseurs)
            days: Nombre de jours à considérer
            
        Returns:
            Dictionnaire contenant les statistiques
        """
        try:
            # Calculer la date limite
            date_limit = datetime.now() - timedelta(days=days)
            date_str = date_limit.strftime("%Y-%m-%d %H:%M:%S")
            
            # Construire la requête
            query = """
            SELECT p.id, p.name, p.api_type, 
                   SUM(u.tokens_used) as total_tokens, 
                   SUM(u.estimated_cost) as total_cost,
                   COUNT(u.id) as operations_count
            FROM api_usage u
            JOIN api_providers p ON u.provider_id = p.id
            WHERE u.created_at >= ?
            """
            
            params = [date_str]
            
            if provider_id is not None:
                query += " AND p.id = ?"
                params.append(provider_id)
                
            query += " GROUP BY p.id, p.name, p.api_type"
            
            self.cursor.execute(query, params)
            
            usage_by_provider = self.cursor.fetchall()
            
            # Construire la requête pour l'utilisation par type d'opération
            query = """
            SELECT u.operation_type, 
                   SUM(u.tokens_used) as total_tokens, 
                   SUM(u.estimated_cost) as total_cost,
                   COUNT(u.id) as operations_count
            FROM api_usage u
            """
            
            if provider_id is not None:
                query += " WHERE u.provider_id = ? AND u.created_at >= ?"
                params = [provider_id, date_str]
            else:
                query += " WHERE u.created_at >= ?"
                params = [date_str]
                
            query += " GROUP BY u.operation_type"
            
            self.cursor.execute(query, params)
            
            usage_by_operation = self.cursor.fetchall()
            
            # Construire le résultat
            result = {
                "total_tokens": 0,
                "total_cost": 0.0,
                "operations_count": 0,
                "by_provider": [],
                "by_operation": []
            }
            
            for provider in usage_by_provider:
                provider_data = {
                    "provider_id": provider[0],
                    "provider_name": provider[1],
                    "api_type": provider[2],
                    "total_tokens": provider[3],
                    "total_cost": provider[4],
                    "operations_count": provider[5]
                }
                
                result["by_provider"].append(provider_data)
                result["total_tokens"] += provider[3]
                result["total_cost"] += provider[4]
                result["operations_count"] += provider[5]
            
            for operation in usage_by_operation:
                operation_data = {
                    "operation_type": operation[0],
                    "total_tokens": operation[1],
                    "total_cost": operation[2],
                    "operations_count": operation[3]
                }
                
                result["by_operation"].append(operation_data)
            
            return result
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des statistiques: {e}")
            return {"error": str(e)}

    def reset_monthly_usage(self, provider_id: int = None) -> int:
        """
        Réinitialise l'utilisation mensuelle.
        
        Args:
            provider_id: ID du fournisseur (si None, tous les fournisseurs)
            
        Returns:
            Nombre de fournisseurs réinitialisés
        """
        try:
            query = """
            UPDATE api_providers 
            SET usage_this_month = 0, 
                updated_at = CURRENT_TIMESTAMP
            """
            
            params = []
            
            if provider_id is not None:
                query += " WHERE id = ?"
                params.append(provider_id)
            
            self.cursor.execute(query, params)
            
            reset_count = self.cursor.rowcount
            
            self.conn.commit()
            
            logger.info(f"{reset_count} fournisseurs réinitialisés")
            
            return reset_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la réinitialisation de l'utilisation: {e}")
            self.conn.rollback()
            return 0

    def check_provider_availability(self, provider_id: int) -> bool:
        """
        Vérifie la disponibilité d'un fournisseur d'API.
        
        Args:
            provider_id: ID du fournisseur
            
        Returns:
            True si le fournisseur est disponible, False sinon
        """
        try:
            # Récupérer les informations du fournisseur
            provider = self.get_provider(provider_id)
            
            if not provider:
                logger.error(f"Fournisseur avec ID {provider_id} non trouvé")
                return False
                
            # Vérifier si le fournisseur est actif
            if not provider["is_active"]:
                logger.warning(f"Fournisseur {provider['name']} non actif")
                return False
                
            # Vérifier le quota mensuel
            if provider["monthly_quota"] > 0 and provider["usage_this_month"] >= provider["monthly_quota"]:
                logger.warning(f"Quota mensuel dépassé pour {provider['name']}")
                return False
                
            # Vérifier la disponibilité selon le type d'API
            api_type = provider["api_type"]
            api_url = provider["api_url"]
            
            if api_type == "local":
                # Pour Ollama, vérifier si le service est en cours d'exécution
                try:
                    response = requests.get(f"{api_url}/api/tags", timeout=2)
                    return response.status_code == 200
                except requests.exceptions.RequestException:
                    logger.warning(f"API locale {api_url} non disponible")
                    return False
            else:
                # Pour les API distantes, vérifier si l'URL est accessible
                try:
                    # Juste vérifier que l'URL est accessible, sans envoyer de requête complète
                    response = requests.head(api_url, timeout=2)
                    return response.status_code < 500  # Accepter tout code sauf les erreurs serveur
                except requests.exceptions.RequestException:
                    logger.warning(f"API distante {api_url} non accessible")
                    return False
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de la disponibilité: {e}")
            return False

    def get_best_provider(self, operation_type: str = "general", model_type: str = "chat") -> Optional[Dict[str, Any]]:
        """
        Récupère le meilleur fournisseur disponible pour une opération donnée.
        
        Args:
            operation_type: Type d'opération (suggestions, matching, general, etc.)
            model_type: Type de modèle (chat, code, etc.)
            
        Returns:
            Dictionnaire contenant les informations du fournisseur, ou None si aucun disponible
        """
        try:
            # Récupérer tous les fournisseurs actifs
            providers = self.get_providers(active_only=True)
            
            if not providers:
                logger.warning("Aucun fournisseur actif trouvé")
                return None
                
            # Filtrer les fournisseurs disponibles
            available_providers = []
            
            for provider in providers:
                # Vérifier le quota mensuel
                if provider["monthly_quota"] > 0 and provider["usage_this_month"] >= provider["monthly_quota"]:
                    continue
                    
                # Vérifier la disponibilité
                if self.check_provider_availability(provider["id"]):
                    # Vérifier si le fournisseur a des modèles du type demandé
                    models = self.get_models(provider["id"], model_type)
                    
                    if models:
                        available_providers.append(provider)
            
            if not available_providers:
                logger.warning("Aucun fournisseur disponible trouvé")
                return None
                
            # Trier par priorité (déjà fait par get_providers)
            return available_providers[0]
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du meilleur fournisseur: {e}")
            return None

    def get_best_model(self, provider_id: int, model_type: str = "chat") -> Optional[Dict[str, Any]]:
        """
        Récupère le meilleur modèle disponible pour un fournisseur donné.
        
        Args:
            provider_id: ID du fournisseur
            model_type: Type de modèle (chat, code, etc.)
            
        Returns:
            Dictionnaire contenant les informations du modèle, ou None si aucun disponible
        """
        try:
            # Récupérer tous les modèles du fournisseur
            models = self.get_models(provider_id, model_type)
            
            if not models:
                logger.warning(f"Aucun modèle de type {model_type} trouvé pour le fournisseur {provider_id}")
                return None
                
            # Filtrer les modèles disponibles
            available_models = [m for m in models if m["is_available"]]
            
            if not available_models:
                logger.warning(f"Aucun modèle disponible trouvé pour le fournisseur {provider_id}")
                return None
                
            # Trier par coût (du moins cher au plus cher)
            available_models.sort(key=lambda m: m["cost_per_1k_input_tokens"] + m["cost_per_1k_output_tokens"])
            
            return available_models[0]
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du meilleur modèle: {e}")
            return None

    def get_ollama_models(self) -> List[str]:
        """
        Récupère la liste des modèles disponibles sur Ollama.
        
        Returns:
            Liste des noms de modèles
        """
        try:
            # Récupérer le fournisseur Ollama
            self.cursor.execute("""
            SELECT id, api_url FROM api_providers 
            WHERE api_type = 'local' AND name LIKE '%Ollama%'
            LIMIT 1
            """)
            
            provider = self.cursor.fetchone()
            
            if not provider:
                logger.warning("Fournisseur Ollama non trouvé")
                return []
                
            provider_id, api_url = provider
            
            # Vérifier si Ollama est disponible
            try:
                response = requests.get(f"{api_url}/api/tags", timeout=5)
                
                if response.status_code != 200:
                    logger.warning(f"Erreur lors de la récupération des modèles Ollama: {response.status_code}")
                    return []
                    
                # Extraire les modèles
                models_data = response.json()
                
                if "models" not in models_data:
                    logger.warning("Format de réponse Ollama inattendu")
                    return []
                    
                models = [model["name"] for model in models_data["models"]]
                
                # Mettre à jour la liste des modèles du fournisseur
                self.cursor.execute("""
                UPDATE api_providers 
                SET models = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (json.dumps(models), provider_id))
                
                # Mettre à jour la table api_models
                for model_name in models:
                    # Vérifier si le modèle existe déjà
                    self.cursor.execute("""
                    SELECT id FROM api_models 
                    WHERE provider_id = ? AND model_name = ?
                    """, (provider_id, model_name))
                    
                    if not self.cursor.fetchone():
                        # Déterminer le type de modèle
                        model_type = "chat"
                        if "code" in model_name.lower():
                            model_type = "code"
                        
                        # Ajouter le modèle
                        self.cursor.execute("""
                        INSERT INTO api_models (
                            provider_id, model_name, model_type, context_length, 
                            cost_per_1k_input_tokens, cost_per_1k_output_tokens, is_available
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            provider_id, model_name, model_type, 4096, 
                            0.0, 0.0, True
                        ))
                
                self.conn.commit()
                
                return models
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Erreur lors de la connexion à Ollama: {e}")
                return []
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des modèles Ollama: {e}")
            return []

    def pull_ollama_model(self, model_name: str) -> bool:
        """
        Télécharge un modèle Ollama s'il n'est pas déjà disponible.
        
        Args:
            model_name: Nom du modèle à télécharger
            
        Returns:
            True si le téléchargement a réussi ou si le modèle est déjà disponible, False sinon
        """
        try:
            # Vérifier si le modèle est déjà disponible
            models = self.get_ollama_models()
            
            if model_name in models:
                logger.info(f"Modèle Ollama {model_name} déjà disponible")
                return True
                
            # Récupérer l'URL de l'API Ollama
            self.cursor.execute("""
            SELECT api_url FROM api_providers 
            WHERE api_type = 'local' AND name LIKE '%Ollama%'
            LIMIT 1
            """)
            
            provider = self.cursor.fetchone()
            
            if not provider:
                logger.warning("Fournisseur Ollama non trouvé")
                return False
                
            api_url = provider[0]
            
            # Télécharger le modèle
            try:
                # Utiliser l'API Ollama pour télécharger le modèle
                payload = {"name": model_name}
                response = requests.post(f"{api_url}/api/pull", json=payload, timeout=10)
                
                if response.status_code != 200:
                    logger.warning(f"Erreur lors du téléchargement du modèle Ollama: {response.status_code}")
                    return False
                    
                # Le téléchargement est asynchrone, donc on ne peut pas savoir immédiatement s'il a réussi
                logger.info(f"Téléchargement du modèle Ollama {model_name} lancé")
                
                # Attendre un peu et vérifier si le modèle est disponible
                time.sleep(5)
                
                models = self.get_ollama_models()
                
                return model_name in models
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Erreur lors de la connexion à Ollama: {e}")
                return False
            
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement du modèle Ollama: {e}")
            return False

    def close(self) -> None:
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Gestionnaire d\'API LLM')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--list-providers', help='Lister les fournisseurs', action='store_true')
    parser.add_argument('--list-models', help='Lister les modèles', action='store_true')
    parser.add_argument('--provider-id', help='ID du fournisseur', type=int)
    parser.add_argument('--add-provider', help='Ajouter un fournisseur', action='store_true')
    parser.add_argument('--update-provider', help='Mettre à jour un fournisseur', action='store_true')
    parser.add_argument('--delete-provider', help='Supprimer un fournisseur', type=int)
    parser.add_argument('--name', help='Nom du fournisseur')
    parser.add_argument('--type', help='Type d\'API')
    parser.add_argument('--url', help='URL de l\'API')
    parser.add_argument('--key', help='Clé d\'API')
    parser.add_argument('--active', help='Définir comme actif', action='store_true')
    parser.add_argument('--inactive', help='Définir comme inactif', action='store_true')
    parser.add_argument('--priority', help='Priorité', type=int)
    parser.add_argument('--cost', help='Coût par 1000 tokens', type=float)
    parser.add_argument('--quota', help='Quota mensuel', type=int)
    parser.add_argument('--add-model', help='Ajouter un modèle', action='store_true')
    parser.add_argument('--update-model', help='Mettre à jour un modèle', action='store_true')
    parser.add_argument('--delete-model', help='Supprimer un modèle', type=int)
    parser.add_argument('--model-id', help='ID du modèle', type=int)
    parser.add_argument('--model-name', help='Nom du modèle')
    parser.add_argument('--model-type', help='Type de modèle')
    parser.add_argument('--context-length', help='Longueur de contexte', type=int)
    parser.add_argument('--input-cost', help='Coût par 1000 tokens d\'entrée', type=float)
    parser.add_argument('--output-cost', help='Coût par 1000 tokens de sortie', type=float)
    parser.add_argument('--available', help='Définir comme disponible', action='store_true')
    parser.add_argument('--unavailable', help='Définir comme indisponible', action='store_true')
    parser.add_argument('--log-usage', help='Enregistrer l\'utilisation', action='store_true')
    parser.add_argument('--operation', help='Type d\'opération')
    parser.add_argument('--tokens', help='Nombre de tokens', type=int)
    parser.add_argument('--stats', help='Afficher les statistiques', action='store_true')
    parser.add_argument('--days', help='Nombre de jours', type=int, default=30)
    parser.add_argument('--reset-usage', help='Réinitialiser l\'utilisation mensuelle', action='store_true')
    parser.add_argument('--check-availability', help='Vérifier la disponibilité', type=int)
    parser.add_argument('--get-best', help='Récupérer le meilleur fournisseur', action='store_true')
    parser.add_argument('--operation-type', help='Type d\'opération pour le meilleur fournisseur', default='general')
    parser.add_argument('--get-ollama-models', help='Récupérer les modèles Ollama', action='store_true')
    parser.add_argument('--pull-ollama', help='Télécharger un modèle Ollama')
    
    args = parser.parse_args()
    
    # Initialiser le gestionnaire d'API
    api_manager = LLMApiManager(args.db)
    
    if args.list_providers:
        # Lister les fournisseurs
        providers = api_manager.get_providers()
        
        print(f"{len(providers)} fournisseurs configurés:")
        for provider in providers:
            active = " (Actif)" if provider["is_active"] else ""
            print(f"  - ID {provider['id']}: {provider['name']} ({provider['api_type']}){active}")
            print(f"    URL: {provider['api_url']}")
            print(f"    Modèles: {', '.join(provider['models'])}")
            print(f"    Priorité: {provider['priority']}")
            print(f"    Coût: {provider['cost_per_1k_tokens']}€ / 1K tokens")
            print(f"    Quota: {provider['monthly_quota']} tokens/mois")
            print(f"    Utilisation: {provider['usage_this_month']} tokens ce mois-ci")
            print()
    
    elif args.list_models:
        # Lister les modèles
        models = api_manager.get_models(args.provider_id)
        
        print(f"{len(models)} modèles configurés:")
        for model in models:
            available = " (Disponible)" if model["is_available"] else " (Indisponible)"
            print(f"  - ID {model['id']}: {model['model_name']} ({model['model_type']}){available}")
            print(f"    Fournisseur: {model['provider_name']}")
            print(f"    Contexte: {model['context_length']} tokens")
            print(f"    Coût: {model['cost_per_1k_input_tokens']}€ / 1K tokens d'entrée, {model['cost_per_1k_output_tokens']}€ / 1K tokens de sortie")
            print()
    
    elif args.add_provider:
        # Ajouter un fournisseur
        if not args.name or not args.type or not args.url:
            print("Erreur: --name, --type et --url sont requis pour ajouter un fournisseur")
        else:
            is_active = True if args.active else False
            provider_id = api_manager.add_provider(
                args.name, args.type, args.url, args.key, 
                None, is_active, args.priority, args.cost, args.quota
            )
            
            if provider_id > 0:
                print(f"Fournisseur ajouté avec ID {provider_id}")
            else:
                print("Erreur lors de l'ajout du fournisseur")
    
    elif args.update_provider:
        # Mettre à jour un fournisseur
        if not args.provider_id:
            print("Erreur: --provider-id est requis pour mettre à jour un fournisseur")
        else:
            is_active = True if args.active else (False if args.inactive else None)
            success = api_manager.update_provider(
                args.provider_id, args.name, args.type, args.url, args.key, 
                None, is_active, args.priority, args.cost, args.quota
            )
            
            if success:
                print(f"Fournisseur avec ID {args.provider_id} mis à jour")
            else:
                print(f"Erreur lors de la mise à jour du fournisseur avec ID {args.provider_id}")
    
    elif args.delete_provider:
        # Supprimer un fournisseur
        success = api_manager.delete_provider(args.delete_provider)
        
        if success:
            print(f"Fournisseur avec ID {args.delete_provider} supprimé")
        else:
            print(f"Erreur lors de la suppression du fournisseur avec ID {args.delete_provider}")
    
    elif args.add_model:
        # Ajouter un modèle
        if not args.provider_id or not args.model_name or not args.model_type:
            print("Erreur: --provider-id, --model-name et --model-type sont requis pour ajouter un modèle")
        else:
            is_available = True if args.available else (False if args.unavailable else True)
            model_id = api_manager.add_model(
                args.provider_id, args.model_name, args.model_type, 
                args.context_length, args.input_cost, args.output_cost, is_available
            )
            
            if model_id > 0:
                print(f"Modèle ajouté avec ID {model_id}")
            else:
                print("Erreur lors de l'ajout du modèle")
    
    elif args.update_model:
        # Mettre à jour un modèle
        if not args.model_id:
            print("Erreur: --model-id est requis pour mettre à jour un modèle")
        else:
            is_available = True if args.available else (False if args.unavailable else None)
            success = api_manager.update_model(
                args.model_id, args.model_name, args.model_type, 
                args.context_length, args.input_cost, args.output_cost, is_available
            )
            
            if success:
                print(f"Modèle avec ID {args.model_id} mis à jour")
            else:
                print(f"Erreur lors de la mise à jour du modèle avec ID {args.model_id}")
    
    elif args.delete_model:
        # Supprimer un modèle
        success = api_manager.delete_model(args.delete_model)
        
        if success:
            print(f"Modèle avec ID {args.delete_model} supprimé")
        else:
            print(f"Erreur lors de la suppression du modèle avec ID {args.delete_model}")
    
    elif args.log_usage:
        # Enregistrer l'utilisation
        if not args.provider_id or not args.operation or not args.tokens:
            print("Erreur: --provider-id, --operation et --tokens sont requis pour enregistrer l'utilisation")
        else:
            success = api_manager.log_api_usage(args.provider_id, args.operation, args.tokens)
            
            if success:
                print(f"Utilisation enregistrée: {args.operation} - {args.tokens} tokens")
            else:
                print("Erreur lors de l'enregistrement de l'utilisation")
    
    elif args.stats:
        # Afficher les statistiques
        stats = api_manager.get_usage_stats(args.provider_id, args.days)
        
        if "error" in stats:
            print(f"Erreur: {stats['error']}")
        else:
            print(f"Statistiques d'utilisation sur {args.days} jours:")
            print(f"  Total: {stats['total_tokens']} tokens - {stats['total_cost']:.4f}€ - {stats['operations_count']} opérations")
            
            print("\nPar fournisseur:")
            for provider in stats["by_provider"]:
                print(f"  - {provider['provider_name']} ({provider['api_type']}): {provider['total_tokens']} tokens - {provider['total_cost']:.4f}€ - {provider['operations_count']} opérations")
            
            print("\nPar opération:")
            for operation in stats["by_operation"]:
                print(f"  - {operation['operation_type']}: {operation['total_tokens']} tokens - {operation['total_cost']:.4f}€ - {operation['operations_count']} opérations")
    
    elif args.reset_usage:
        # Réinitialiser l'utilisation mensuelle
        reset_count = api_manager.reset_monthly_usage(args.provider_id)
        print(f"{reset_count} fournisseurs réinitialisés")
    
    elif args.check_availability:
        # Vérifier la disponibilité
        available = api_manager.check_provider_availability(args.check_availability)
        
        if available:
            print(f"Fournisseur avec ID {args.check_availability} disponible")
        else:
            print(f"Fournisseur avec ID {args.check_availability} non disponible")
    
    elif args.get_best:
        # Récupérer le meilleur fournisseur
        provider = api_manager.get_best_provider(args.operation_type, args.model_type)
        
        if provider:
            print(f"Meilleur fournisseur pour {args.operation_type} ({args.model_type}):")
            print(f"  - ID {provider['id']}: {provider['name']} ({provider['api_type']})")
            print(f"    URL: {provider['api_url']}")
            print(f"    Modèles: {', '.join(provider['models'])}")
            print(f"    Priorité: {provider['priority']}")
            print(f"    Coût: {provider['cost_per_1k_tokens']}€ / 1K tokens")
            
            # Récupérer le meilleur modèle
            model = api_manager.get_best_model(provider['id'], args.model_type)
            
            if model:
                print(f"\nMeilleur modèle:")
                print(f"  - ID {model['id']}: {model['model_name']} ({model['model_type']})")
                print(f"    Contexte: {model['context_length']} tokens")
                print(f"    Coût: {model['cost_per_1k_input_tokens']}€ / 1K tokens d'entrée, {model['cost_per_1k_output_tokens']}€ / 1K tokens de sortie")
        else:
            print(f"Aucun fournisseur disponible pour {args.operation_type} ({args.model_type})")
    
    elif args.get_ollama_models:
        # Récupérer les modèles Ollama
        models = api_manager.get_ollama_models()
        
        if models:
            print(f"{len(models)} modèles Ollama disponibles:")
            for model in models:
                print(f"  - {model}")
        else:
            print("Aucun modèle Ollama disponible ou Ollama non accessible")
    
    elif args.pull_ollama:
        # Télécharger un modèle Ollama
        success = api_manager.pull_ollama_model(args.pull_ollama)
        
        if success:
            print(f"Modèle Ollama {args.pull_ollama} téléchargé ou déjà disponible")
        else:
            print(f"Erreur lors du téléchargement du modèle Ollama {args.pull_ollama}")
    
    else:
        # Afficher l'aide
        parser.print_help()
    
    # Fermer la connexion
    api_manager.close()
