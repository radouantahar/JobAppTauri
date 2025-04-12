#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de détection des doublons pour l'application d'automatisation de recherche d'emploi
Ce module permet de détecter et gérer les offres d'emploi en doublon.
"""

import os
import re
import json
import logging
import sqlite3
import difflib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import hashlib
from collections import defaultdict

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DuplicateDetector:
    """
    Classe pour détecter et gérer les offres d'emploi en doublon.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du détecteur de doublons.
        
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
            # Vérifier si la table job_duplicates existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='job_duplicates'
            """)
            
            if not self.cursor.fetchone():
                logger.info("Création de la table job_duplicates")
                
                # Créer la table job_duplicates
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS job_duplicates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    original_job_id INTEGER NOT NULL,
                    duplicate_job_id INTEGER NOT NULL,
                    similarity_score REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (original_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY (duplicate_job_id) REFERENCES jobs(id) ON DELETE CASCADE
                )
                """)
                
                # Créer un index pour accélérer les recherches
                self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_job_duplicates_original 
                ON job_duplicates(original_job_id)
                """)
                
                self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_job_duplicates_duplicate 
                ON job_duplicates(duplicate_job_id)
                """)
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la vérification/création des tables: {e}")
            self.conn.rollback()
            raise

    def _normalize_text(self, text: str) -> str:
        """
        Normalise un texte pour la comparaison.
        
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

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calcule la similarité entre deux textes.
        
        Args:
            text1: Premier texte
            text2: Deuxième texte
            
        Returns:
            Score de similarité entre 0.0 et 1.0
        """
        # Normaliser les textes
        text1 = self._normalize_text(text1)
        text2 = self._normalize_text(text2)
        
        # Si l'un des textes est vide, retourner 0.0
        if not text1 or not text2:
            return 0.0
            
        # Calculer la similarité avec SequenceMatcher
        similarity = difflib.SequenceMatcher(None, text1, text2).ratio()
        
        return similarity

    def _calculate_job_hash(self, job: Dict[str, Any]) -> str:
        """
        Calcule un hash pour une offre d'emploi.
        
        Args:
            job: Dictionnaire contenant les informations de l'offre
            
        Returns:
            Hash de l'offre
        """
        # Créer une chaîne de caractères à partir des informations importantes
        job_str = f"{job.get('title', '')}{job.get('company_name', '')}{job.get('location', '')}"
        
        # Normaliser la chaîne
        job_str = self._normalize_text(job_str)
        
        # Calculer le hash
        job_hash = hashlib.md5(job_str.encode()).hexdigest()
        
        return job_hash

    def detect_duplicates(self, threshold: float = 0.8, batch_size: int = 100) -> int:
        """
        Détecte les offres d'emploi en doublon.
        
        Args:
            threshold: Seuil de similarité (entre 0.0 et 1.0)
            batch_size: Taille des lots d'offres à traiter
            
        Returns:
            Nombre de doublons détectés
        """
        try:
            # Récupérer toutes les offres d'emploi
            self.cursor.execute("""
            SELECT j.id, j.title, j.description, j.location, c.name as company_name, j.url, j.source
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            """)
            
            jobs = self.cursor.fetchall()
            
            # Convertir en dictionnaires
            jobs_dict = {}
            for job in jobs:
                jobs_dict[job[0]] = {
                    "id": job[0],
                    "title": job[1],
                    "description": job[2],
                    "location": job[3],
                    "company_name": job[4],
                    "url": job[5],
                    "source": job[6]
                }
            
            # Calculer les hashes pour chaque offre
            job_hashes = {}
            for job_id, job in jobs_dict.items():
                job_hashes[job_id] = self._calculate_job_hash(job)
            
            # Regrouper les offres par hash
            hash_groups = defaultdict(list)
            for job_id, job_hash in job_hashes.items():
                hash_groups[job_hash].append(job_id)
            
            # Compter les doublons détectés
            duplicate_count = 0
            
            # Parcourir les groupes de hash
            for job_hash, job_ids in hash_groups.items():
                # Si le groupe contient plus d'une offre, ce sont potentiellement des doublons
                if len(job_ids) > 1:
                    # Trier les offres par ID (supposant que les IDs plus petits sont plus anciens)
                    job_ids.sort()
                    
                    # Considérer la première offre comme l'originale
                    original_job_id = job_ids[0]
                    original_job = jobs_dict[original_job_id]
                    
                    # Comparer avec les autres offres du groupe
                    for duplicate_job_id in job_ids[1:]:
                        duplicate_job = jobs_dict[duplicate_job_id]
                        
                        # Calculer la similarité entre les titres
                        title_similarity = self._calculate_similarity(
                            original_job["title"], 
                            duplicate_job["title"]
                        )
                        
                        # Calculer la similarité entre les descriptions (si disponibles)
                        description_similarity = 0.0
                        if original_job["description"] and duplicate_job["description"]:
                            description_similarity = self._calculate_similarity(
                                original_job["description"], 
                                duplicate_job["description"]
                            )
                        
                        # Calculer la similarité globale (moyenne pondérée)
                        if description_similarity > 0:
                            similarity_score = (title_similarity * 0.7) + (description_similarity * 0.3)
                        else:
                            similarity_score = title_similarity
                        
                        # Si la similarité est supérieure au seuil, c'est un doublon
                        if similarity_score >= threshold:
                            # Vérifier si ce doublon existe déjà
                            self.cursor.execute("""
                            SELECT id FROM job_duplicates 
                            WHERE original_job_id = ? AND duplicate_job_id = ?
                            """, (original_job_id, duplicate_job_id))
                            
                            if not self.cursor.fetchone():
                                # Enregistrer le doublon
                                self.cursor.execute("""
                                INSERT INTO job_duplicates (original_job_id, duplicate_job_id, similarity_score)
                                VALUES (?, ?, ?)
                                """, (original_job_id, duplicate_job_id, similarity_score))
                                
                                duplicate_count += 1
            
            self.conn.commit()
            
            logger.info(f"{duplicate_count} doublons détectés")
            
            return duplicate_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la détection des doublons: {e}")
            self.conn.rollback()
            return 0

    def detect_duplicates_by_url(self) -> int:
        """
        Détecte les offres d'emploi en doublon par URL.
        
        Returns:
            Nombre de doublons détectés
        """
        try:
            # Récupérer toutes les offres d'emploi avec URL
            self.cursor.execute("""
            SELECT id, url 
            FROM jobs 
            WHERE url IS NOT NULL AND url != ''
            """)
            
            jobs = self.cursor.fetchall()
            
            # Regrouper les offres par URL
            url_groups = defaultdict(list)
            for job_id, url in jobs:
                # Normaliser l'URL (supprimer les paramètres de tracking, etc.)
                normalized_url = re.sub(r'\?.*$', '', url)
                url_groups[normalized_url].append(job_id)
            
            # Compter les doublons détectés
            duplicate_count = 0
            
            # Parcourir les groupes d'URL
            for url, job_ids in url_groups.items():
                # Si le groupe contient plus d'une offre, ce sont des doublons
                if len(job_ids) > 1:
                    # Trier les offres par ID (supposant que les IDs plus petits sont plus anciens)
                    job_ids.sort()
                    
                    # Considérer la première offre comme l'originale
                    original_job_id = job_ids[0]
                    
                    # Enregistrer les autres offres comme doublons
                    for duplicate_job_id in job_ids[1:]:
                        # Vérifier si ce doublon existe déjà
                        self.cursor.execute("""
                        SELECT id FROM job_duplicates 
                        WHERE original_job_id = ? AND duplicate_job_id = ?
                        """, (original_job_id, duplicate_job_id))
                        
                        if not self.cursor.fetchone():
                            # Enregistrer le doublon
                            self.cursor.execute("""
                            INSERT INTO job_duplicates (original_job_id, duplicate_job_id, similarity_score)
                            VALUES (?, ?, ?)
                            """, (original_job_id, duplicate_job_id, 1.0))  # Score de 1.0 pour les URL identiques
                            
                            duplicate_count += 1
            
            self.conn.commit()
            
            logger.info(f"{duplicate_count} doublons détectés par URL")
            
            return duplicate_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la détection des doublons par URL: {e}")
            self.conn.rollback()
            return 0

    def get_duplicates(self, job_id: int = None) -> List[Dict[str, Any]]:
        """
        Récupère les doublons détectés.
        
        Args:
            job_id: ID de l'offre d'emploi (si None, tous les doublons)
            
        Returns:
            Liste des doublons
        """
        try:
            query = """
            SELECT d.id, d.original_job_id, o.title as original_title, 
                   d.duplicate_job_id, dup.title as duplicate_title, 
                   d.similarity_score, d.created_at
            FROM job_duplicates d
            JOIN jobs o ON d.original_job_id = o.id
            JOIN jobs dup ON d.duplicate_job_id = dup.id
            """
            
            params = []
            
            if job_id is not None:
                query += " WHERE d.original_job_id = ? OR d.duplicate_job_id = ?"
                params = [job_id, job_id]
                
            query += " ORDER BY d.similarity_score DESC"
            
            self.cursor.execute(query, params)
            
            duplicates = self.cursor.fetchall()
            
            return [
                {
                    "id": dup[0],
                    "original_job_id": dup[1],
                    "original_title": dup[2],
                    "duplicate_job_id": dup[3],
                    "duplicate_title": dup[4],
                    "similarity_score": dup[5],
                    "created_at": dup[6]
                }
                for dup in duplicates
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des doublons: {e}")
            return []

    def merge_duplicates(self, original_job_id: int, duplicate_job_id: int) -> bool:
        """
        Fusionne deux offres d'emploi en doublon.
        
        Args:
            original_job_id: ID de l'offre originale
            duplicate_job_id: ID de l'offre en doublon
            
        Returns:
            True si la fusion a réussi, False sinon
        """
        try:
            # Vérifier si les offres existent
            self.cursor.execute("""
            SELECT id FROM jobs WHERE id IN (?, ?)
            """, (original_job_id, duplicate_job_id))
            
            if len(self.cursor.fetchall()) != 2:
                logger.error(f"L'une des offres n'existe pas: {original_job_id}, {duplicate_job_id}")
                return False
            
            # Récupérer les informations des offres
            self.cursor.execute("""
            SELECT id, title, description, location, company_id, url, source, 
                   job_type, salary_min, salary_max, currency, date_posted, 
                   date_scraped, status, matching_score
            FROM jobs
            WHERE id IN (?, ?)
            """, (original_job_id, duplicate_job_id))
            
            jobs = self.cursor.fetchall()
            
            # Convertir en dictionnaires
            jobs_dict = {}
            for job in jobs:
                jobs_dict[job[0]] = {
                    "id": job[0],
                    "title": job[1],
                    "description": job[2],
                    "location": job[3],
                    "company_id": job[4],
                    "url": job[5],
                    "source": job[6],
                    "job_type": job[7],
                    "salary_min": job[8],
                    "salary_max": job[9],
                    "currency": job[10],
                    "date_posted": job[11],
                    "date_scraped": job[12],
                    "status": job[13],
                    "matching_score": job[14]
                }
            
            original_job = jobs_dict[original_job_id]
            duplicate_job = jobs_dict[duplicate_job_id]
            
            # Fusionner les informations (prendre les informations non nulles du doublon si l'original est null)
            merged_job = original_job.copy()
            
            for key, value in duplicate_job.items():
                if key == "id":
                    continue
                    
                if not merged_job[key] and value:
                    merged_job[key] = value
                    
                # Pour certains champs, prendre la valeur la plus récente ou la plus élevée
                if key == "date_scraped" and value and merged_job[key]:
                    # Prendre la date la plus récente
                    if value > merged_job[key]:
                        merged_job[key] = value
                        
                if key in ["salary_min", "salary_max", "matching_score"] and value and merged_job[key]:
                    # Prendre la valeur la plus élevée
                    if value > merged_job[key]:
                        merged_job[key] = value
            
            # Mettre à jour l'offre originale avec les informations fusionnées
            self.cursor.execute("""
            UPDATE jobs
            SET title = ?, description = ?, location = ?, company_id = ?, 
                url = ?, source = ?, job_type = ?, salary_min = ?, 
                salary_max = ?, currency = ?, date_posted = ?, 
                date_scraped = ?, status = ?, matching_score = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (
                merged_job["title"], merged_job["description"], merged_job["location"], 
                merged_job["company_id"], merged_job["url"], merged_job["source"], 
                merged_job["job_type"], merged_job["salary_min"], merged_job["salary_max"], 
                merged_job["currency"], merged_job["date_posted"], merged_job["date_scraped"], 
                merged_job["status"], merged_job["matching_score"], original_job_id
            ))
            
            # Mettre à jour les références dans les autres tables
            
            # Transport data
            self.cursor.execute("""
            UPDATE transport_data
            SET job_id = ?
            WHERE job_id = ?
            """, (original_job_id, duplicate_job_id))
            
            # Applications
            self.cursor.execute("""
            UPDATE applications
            SET job_id = ?
            WHERE job_id = ?
            """, (original_job_id, duplicate_job_id))
            
            # Kanban cards
            self.cursor.execute("""
            UPDATE kanban_cards
            SET job_id = ?
            WHERE job_id = ?
            """, (original_job_id, duplicate_job_id))
            
            # Supprimer l'offre en doublon
            self.cursor.execute("""
            DELETE FROM jobs
            WHERE id = ?
            """, (duplicate_job_id,))
            
            # Supprimer les références dans job_duplicates
            self.cursor.execute("""
            DELETE FROM job_duplicates
            WHERE original_job_id = ? OR duplicate_job_id = ?
            """, (duplicate_job_id, duplicate_job_id))
            
            self.conn.commit()
            
            logger.info(f"Offres fusionnées: {original_job_id} <- {duplicate_job_id}")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la fusion des offres: {e}")
            self.conn.rollback()
            return False

    def auto_merge_duplicates(self, threshold: float = 0.9) -> int:
        """
        Fusionne automatiquement les offres en doublon avec un score de similarité élevé.
        
        Args:
            threshold: Seuil de similarité pour la fusion automatique
            
        Returns:
            Nombre d'offres fusionnées
        """
        try:
            # Récupérer les doublons avec un score de similarité élevé
            self.cursor.execute("""
            SELECT original_job_id, duplicate_job_id
            FROM job_duplicates
            WHERE similarity_score >= ?
            ORDER BY similarity_score DESC
            """, (threshold,))
            
            duplicates = self.cursor.fetchall()
            
            # Compter les fusions réussies
            merged_count = 0
            
            # Parcourir les doublons
            for original_job_id, duplicate_job_id in duplicates:
                # Vérifier si les offres existent toujours
                self.cursor.execute("""
                SELECT COUNT(*) FROM jobs WHERE id IN (?, ?)
                """, (original_job_id, duplicate_job_id))
                
                if self.cursor.fetchone()[0] == 2:
                    # Fusionner les offres
                    if self.merge_duplicates(original_job_id, duplicate_job_id):
                        merged_count += 1
            
            logger.info(f"{merged_count} offres fusionnées automatiquement")
            
            return merged_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la fusion automatique des offres: {e}")
            self.conn.rollback()
            return 0

    def ignore_duplicate(self, duplicate_id: int) -> bool:
        """
        Ignore un doublon détecté.
        
        Args:
            duplicate_id: ID du doublon à ignorer
            
        Returns:
            True si l'opération a réussi, False sinon
        """
        try:
            # Supprimer le doublon
            self.cursor.execute("""
            DELETE FROM job_duplicates
            WHERE id = ?
            """, (duplicate_id,))
            
            if self.cursor.rowcount == 0:
                logger.error(f"Doublon avec ID {duplicate_id} non trouvé")
                return False
                
            self.conn.commit()
            
            logger.info(f"Doublon avec ID {duplicate_id} ignoré")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ignorance du doublon: {e}")
            self.conn.rollback()
            return False

    def get_duplicate_stats(self) -> Dict[str, Any]:
        """
        Récupère des statistiques sur les doublons.
        
        Returns:
            Dictionnaire contenant les statistiques
        """
        try:
            stats = {
                "total_duplicates": 0,
                "high_similarity": 0,
                "medium_similarity": 0,
                "low_similarity": 0,
                "by_source": {}
            }
            
            # Compter le nombre total de doublons
            self.cursor.execute("""
            SELECT COUNT(*) FROM job_duplicates
            """)
            
            stats["total_duplicates"] = self.cursor.fetchone()[0]
            
            # Compter les doublons par niveau de similarité
            self.cursor.execute("""
            SELECT 
                COUNT(CASE WHEN similarity_score >= 0.9 THEN 1 END) as high,
                COUNT(CASE WHEN similarity_score >= 0.7 AND similarity_score < 0.9 THEN 1 END) as medium,
                COUNT(CASE WHEN similarity_score < 0.7 THEN 1 END) as low
            FROM job_duplicates
            """)
            
            similarity_counts = self.cursor.fetchone()
            stats["high_similarity"] = similarity_counts[0]
            stats["medium_similarity"] = similarity_counts[1]
            stats["low_similarity"] = similarity_counts[2]
            
            # Compter les doublons par source
            self.cursor.execute("""
            SELECT j1.source, j2.source, COUNT(*) as count
            FROM job_duplicates d
            JOIN jobs j1 ON d.original_job_id = j1.id
            JOIN jobs j2 ON d.duplicate_job_id = j2.id
            GROUP BY j1.source, j2.source
            """)
            
            for source1, source2, count in self.cursor.fetchall():
                source_key = f"{source1}-{source2}"
                stats["by_source"][source_key] = count
            
            return stats
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des statistiques: {e}")
            return {"error": str(e)}

    def close(self) -> None:
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Détecteur de doublons pour les offres d\'emploi')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--detect', help='Détecter les doublons', action='store_true')
    parser.add_argument('--detect-url', help='Détecter les doublons par URL', action='store_true')
    parser.add_argument('--threshold', help='Seuil de similarité', type=float, default=0.8)
    parser.add_argument('--list', help='Lister les doublons', action='store_true')
    parser.add_argument('--job-id', help='ID de l\'offre d\'emploi', type=int)
    parser.add_argument('--merge', help='Fusionner deux offres', action='store_true')
    parser.add_argument('--original-id', help='ID de l\'offre originale', type=int)
    parser.add_argument('--duplicate-id', help='ID de l\'offre en doublon', type=int)
    parser.add_argument('--auto-merge', help='Fusionner automatiquement les doublons', action='store_true')
    parser.add_argument('--ignore', help='Ignorer un doublon', type=int)
    parser.add_argument('--stats', help='Afficher les statistiques', action='store_true')
    
    args = parser.parse_args()
    
    # Initialiser le détecteur de doublons
    detector = DuplicateDetector(args.db)
    
    if args.detect:
        # Détecter les doublons
        duplicate_count = detector.detect_duplicates(args.threshold)
        print(f"{duplicate_count} doublons détectés avec un seuil de similarité de {args.threshold}")
    
    elif args.detect_url:
        # Détecter les doublons par URL
        duplicate_count = detector.detect_duplicates_by_url()
        print(f"{duplicate_count} doublons détectés par URL")
    
    elif args.list:
        # Lister les doublons
        duplicates = detector.get_duplicates(args.job_id)
        
        print(f"{len(duplicates)} doublons trouvés:")
        for dup in duplicates:
            print(f"ID: {dup['id']}")
            print(f"  Original: {dup['original_job_id']} - {dup['original_title']}")
            print(f"  Doublon: {dup['duplicate_job_id']} - {dup['duplicate_title']}")
            print(f"  Score de similarité: {dup['similarity_score']:.2f}")
            print(f"  Détecté le: {dup['created_at']}")
            print()
    
    elif args.merge:
        # Fusionner deux offres
        if not args.original_id or not args.duplicate_id:
            print("Erreur: --original-id et --duplicate-id sont requis pour fusionner des offres")
        else:
            success = detector.merge_duplicates(args.original_id, args.duplicate_id)
            if success:
                print(f"Offres fusionnées: {args.original_id} <- {args.duplicate_id}")
            else:
                print("Erreur lors de la fusion des offres")
    
    elif args.auto_merge:
        # Fusionner automatiquement les doublons
        merged_count = detector.auto_merge_duplicates(args.threshold)
        print(f"{merged_count} offres fusionnées automatiquement avec un seuil de similarité de {args.threshold}")
    
    elif args.ignore:
        # Ignorer un doublon
        success = detector.ignore_duplicate(args.ignore)
        if success:
            print(f"Doublon avec ID {args.ignore} ignoré")
        else:
            print(f"Erreur lors de l'ignorance du doublon avec ID {args.ignore}")
    
    elif args.stats:
        # Afficher les statistiques
        stats = detector.get_duplicate_stats()
        
        if "error" in stats:
            print(f"Erreur: {stats['error']}")
        else:
            print(f"Statistiques des doublons:")
            print(f"  Total: {stats['total_duplicates']}")
            print(f"  Similarité élevée (>= 0.9): {stats['high_similarity']}")
            print(f"  Similarité moyenne (0.7-0.9): {stats['medium_similarity']}")
            print(f"  Similarité faible (< 0.7): {stats['low_similarity']}")
            
            if stats["by_source"]:
                print("\nPar source:")
                for source_pair, count in stats["by_source"].items():
                    print(f"  {source_pair}: {count}")
    
    else:
        # Afficher l'aide
        parser.print_help()
    
    # Fermer la connexion
    detector.close()
