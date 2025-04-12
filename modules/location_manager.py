#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de gestion des domiciles multiples pour l'application d'automatisation de recherche d'emploi
Ce module permet de gérer les domiciles de l'utilisateur et de calculer les temps de trajet.
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


class LocationManager:
    """
    Classe pour gérer les domiciles de l'utilisateur et les temps de trajet associés.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du gestionnaire de domiciles.
        
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
            # Vérifier si la table user_locations existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_locations'
            """)
            
            if not self.cursor.fetchone():
                logger.info("Création de la table user_locations")
                
                # Créer la table user_locations
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    is_primary BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
                )
                """)
                
                # Créer un domicile principal par défaut
                self._create_default_locations()
            
            # Vérifier si la table transport_data a la structure attendue
            self.cursor.execute("""
            PRAGMA table_info(transport_data)
            """)
            
            columns = {column[1] for column in self.cursor.fetchall()}
            
            if 'location_id' not in columns:
                logger.info("Mise à jour de la table transport_data pour supporter les domiciles multiples")
                
                # Renommer la table existante
                self.cursor.execute("ALTER TABLE transport_data RENAME TO transport_data_old")
                
                # Créer la nouvelle table
                self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS transport_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL,
                    location_id INTEGER NOT NULL,
                    travel_time INTEGER,
                    travel_mode TEXT,
                    distance REAL,
                    route_details TEXT,
                    scrape_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE CASCADE,
                    UNIQUE (job_id, location_id, travel_mode)
                )
                """)
                
                # Migrer les données existantes
                self._migrate_transport_data()
            
            self.conn.commit()
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la vérification/création des tables: {e}")
            self.conn.rollback()
            raise

    def _create_default_locations(self) -> None:
        """Crée les domiciles par défaut pour l'utilisateur."""
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
            
            # Créer un domicile principal par défaut
            self.cursor.execute("""
            INSERT INTO user_locations (user_id, name, address, is_primary)
            VALUES (?, ?, ?, ?)
            """, (user_id, "Domicile Principal", "Adresse non spécifiée", 1))
            
            # Créer un domicile secondaire par défaut
            self.cursor.execute("""
            INSERT INTO user_locations (user_id, name, address, is_primary)
            VALUES (?, ?, ?, ?)
            """, (user_id, "Domicile Secondaire", "Adresse non spécifiée", 0))
            
            self.conn.commit()
            
            logger.info("Domiciles par défaut créés")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des domiciles par défaut: {e}")
            self.conn.rollback()

    def _migrate_transport_data(self) -> None:
        """Migre les données de transport de l'ancienne table vers la nouvelle."""
        try:
            # Vérifier si l'ancienne table existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='transport_data_old'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("Aucune ancienne table transport_data à migrer")
                return
            
            # Récupérer l'ID du domicile principal
            self.cursor.execute("""
            SELECT id FROM user_locations WHERE is_primary = 1 LIMIT 1
            """)
            
            location_id_result = self.cursor.fetchone()
            
            if not location_id_result:
                logger.error("Aucun domicile principal trouvé pour la migration")
                return
                
            location_id = location_id_result[0]
            
            # Migrer les données
            self.cursor.execute("""
            INSERT INTO transport_data (
                job_id, location_id, travel_time, travel_mode, distance, route_details, scrape_url
            )
            SELECT 
                job_id, ?, travel_time, travel_mode, distance, route_details, scrape_url
            FROM transport_data_old
            """, (location_id,))
            
            # Compter le nombre de lignes migrées
            migrated_count = self.cursor.rowcount
            
            self.conn.commit()
            
            logger.info(f"{migrated_count} entrées de données de transport migrées")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la migration des données de transport: {e}")
            self.conn.rollback()

    def get_user_locations(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des domiciles de l'utilisateur.
        
        Returns:
            Liste des domiciles
        """
        try:
            self.cursor.execute("""
            SELECT id, name, address, is_primary 
            FROM user_locations 
            ORDER BY is_primary DESC, name
            """)
            
            locations = self.cursor.fetchall()
            
            return [
                {
                    "id": loc[0],
                    "name": loc[1],
                    "address": loc[2],
                    "is_primary": bool(loc[3])
                }
                for loc in locations
            ]
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des domiciles: {e}")
            return []

    def add_user_location(self, name: str, address: str, is_primary: bool = False) -> int:
        """
        Ajoute un nouveau domicile pour l'utilisateur.
        
        Args:
            name: Nom du domicile
            address: Adresse complète
            is_primary: Si True, ce domicile devient le domicile principal
            
        Returns:
            ID du nouveau domicile
        """
        try:
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id_result = self.cursor.fetchone()
            
            if not user_id_result:
                logger.error("Aucun profil utilisateur trouvé")
                return -1
                
            user_id = user_id_result[0]
            
            # Si ce domicile doit être principal, mettre à jour les autres
            if is_primary:
                self.cursor.execute("""
                UPDATE user_locations 
                SET is_primary = 0 
                WHERE user_id = ?
                """, (user_id,))
            
            # Insérer le nouveau domicile
            self.cursor.execute("""
            INSERT INTO user_locations (user_id, name, address, is_primary)
            VALUES (?, ?, ?, ?)
            """, (user_id, name, address, is_primary))
            
            location_id = self.cursor.lastrowid
            
            self.conn.commit()
            
            logger.info(f"Nouveau domicile ajouté: {name} ({address})")
            
            return location_id
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de l'ajout du domicile: {e}")
            self.conn.rollback()
            return -1

    def update_user_location(self, location_id: int, name: str = None, address: str = None, is_primary: bool = None) -> bool:
        """
        Met à jour un domicile existant.
        
        Args:
            location_id: ID du domicile à mettre à jour
            name: Nouveau nom (si None, conserve l'ancien)
            address: Nouvelle adresse (si None, conserve l'ancienne)
            is_primary: Nouveau statut principal (si None, conserve l'ancien)
            
        Returns:
            True si la mise à jour a réussi, False sinon
        """
        try:
            # Vérifier si le domicile existe
            self.cursor.execute("""
            SELECT id, user_id, name, address, is_primary 
            FROM user_locations 
            WHERE id = ?
            """, (location_id,))
            
            location = self.cursor.fetchone()
            
            if not location:
                logger.error(f"Domicile avec ID {location_id} non trouvé")
                return False
                
            # Préparer les valeurs à mettre à jour
            update_name = name if name is not None else location[2]
            update_address = address if address is not None else location[3]
            update_is_primary = is_primary if is_primary is not None else bool(location[4])
            
            # Si ce domicile doit être principal, mettre à jour les autres
            if update_is_primary and not bool(location[4]):
                self.cursor.execute("""
                UPDATE user_locations 
                SET is_primary = 0 
                WHERE user_id = ?
                """, (location[1],))
            
            # Mettre à jour le domicile
            self.cursor.execute("""
            UPDATE user_locations 
            SET name = ?, address = ?, is_primary = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, (update_name, update_address, update_is_primary, location_id))
            
            self.conn.commit()
            
            logger.info(f"Domicile mis à jour: {update_name} ({update_address})")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la mise à jour du domicile: {e}")
            self.conn.rollback()
            return False

    def delete_user_location(self, location_id: int) -> bool:
        """
        Supprime un domicile existant.
        
        Args:
            location_id: ID du domicile à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        try:
            # Vérifier si le domicile existe
            self.cursor.execute("""
            SELECT id, is_primary 
            FROM user_locations 
            WHERE id = ?
            """, (location_id,))
            
            location = self.cursor.fetchone()
            
            if not location:
                logger.error(f"Domicile avec ID {location_id} non trouvé")
                return False
                
            # Empêcher la suppression du dernier domicile principal
            if bool(location[1]):
                # Vérifier s'il y a d'autres domiciles
                self.cursor.execute("SELECT COUNT(*) FROM user_locations")
                count = self.cursor.fetchone()[0]
                
                if count <= 1:
                    logger.error("Impossible de supprimer le dernier domicile")
                    return False
                    
                # Vérifier s'il y a d'autres domiciles non principaux
                self.cursor.execute("SELECT COUNT(*) FROM user_locations WHERE is_primary = 0")
                non_primary_count = self.cursor.fetchone()[0]
                
                if non_primary_count == 0:
                    logger.error("Impossible de supprimer le seul domicile principal")
                    return False
                    
                # Définir un autre domicile comme principal
                self.cursor.execute("""
                UPDATE user_locations 
                SET is_primary = 1 
                WHERE id != ? 
                LIMIT 1
                """, (location_id,))
            
            # Supprimer les données de transport associées
            self.cursor.execute("""
            DELETE FROM transport_data 
            WHERE location_id = ?
            """, (location_id,))
            
            # Supprimer le domicile
            self.cursor.execute("""
            DELETE FROM user_locations 
            WHERE id = ?
            """, (location_id,))
            
            self.conn.commit()
            
            logger.info(f"Domicile avec ID {location_id} supprimé")
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression du domicile: {e}")
            self.conn.rollback()
            return False

    def get_transport_data_for_job(self, job_id: int) -> Dict[str, Any]:
        """
        Récupère les données de transport pour une offre d'emploi.
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            Dictionnaire contenant les données de transport pour chaque domicile
        """
        try:
            # Récupérer les informations de l'offre
            self.cursor.execute("""
            SELECT id, title, location 
            FROM jobs 
            WHERE id = ?
            """, (job_id,))
            
            job = self.cursor.fetchone()
            
            if not job:
                logger.error(f"Offre avec ID {job_id} non trouvée")
                return {"error": f"Offre avec ID {job_id} non trouvée"}
                
            # Récupérer les données de transport pour chaque domicile
            self.cursor.execute("""
            SELECT t.location_id, l.name, t.travel_time, t.travel_mode, t.distance, t.route_details
            FROM transport_data t
            JOIN user_locations l ON t.location_id = l.id
            WHERE t.job_id = ?
            ORDER BY l.is_primary DESC, t.travel_time
            """, (job_id,))
            
            transport_data = self.cursor.fetchall()
            
            # Convertir les résultats en dictionnaire
            locations_data = []
            for data in transport_data:
                route_details = None
                if data[5]:
                    try:
                        route_details = json.loads(data[5])
                    except json.JSONDecodeError:
                        route_details = {"error": "Format JSON invalide"}
                
                locations_data.append({
                    "location_id": data[0],
                    "location_name": data[1],
                    "travel_time": data[2],
                    "travel_mode": data[3],
                    "distance": data[4],
                    "route_details": route_details
                })
            
            return {
                "job_id": job[0],
                "job_title": job[1],
                "job_location": job[2],
                "locations_data": locations_data
            }
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des données de transport: {e}")
            return {"error": str(e)}

    def get_best_location_for_job(self, job_id: int) -> Dict[str, Any]:
        """
        Détermine le meilleur domicile pour une offre d'emploi donnée.
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            Dictionnaire contenant les informations du meilleur domicile
        """
        try:
            # Récupérer les temps de trajet pour tous les domiciles
            self.cursor.execute("""
            SELECT t.location_id, l.name, l.address, t.travel_time, t.distance, t.travel_mode
            FROM transport_data t
            JOIN user_locations l ON t.location_id = l.id
            WHERE t.job_id = ? AND t.travel_mode = 'public_transport'
            ORDER BY t.travel_time
            """, (job_id,))
            
            locations = self.cursor.fetchall()
            
            if not locations:
                logger.warning(f"Aucune donnée de transport trouvée pour l'offre {job_id}")
                return {"error": "Aucune donnée de transport trouvée"}
                
            # Le meilleur domicile est celui avec le temps de trajet le plus court
            best_location = locations[0]
            
            return {
                "job_id": job_id,
                "location_id": best_location[0],
                "location_name": best_location[1],
                "location_address": best_location[2],
                "travel_time": best_location[3],
                "distance": best_location[4],
                "travel_mode": best_location[5]
            }
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la détermination du meilleur domicile: {e}")
            return {"error": str(e)}

    def filter_jobs_by_travel_time(self, max_travel_time: int = 60, any_location: bool = True) -> List[Dict[str, Any]]:
        """
        Filtre les offres d'emploi par temps de trajet.
        
        Args:
            max_travel_time: Temps de trajet maximum en minutes
            any_location: Si True, inclut les offres où au moins un domicile respecte le critère
                          Si False, inclut uniquement les offres où tous les domiciles respectent le critère
            
        Returns:
            Liste des offres d'emploi filtrées avec leurs informations de transport
        """
        try:
            query = ""
            
            if any_location:
                # Offres où au moins un domicile respecte le critère
                query = """
                SELECT DISTINCT j.id, j.title, j.company_id, c.name as company_name, j.location, 
                       j.matching_score, j.status, j.date_posted
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                JOIN transport_data t ON j.id = t.job_id AND t.travel_mode = 'public_transport'
                WHERE t.travel_time <= ?
                ORDER BY j.matching_score DESC, t.travel_time
                """
            else:
                # Offres où tous les domiciles respectent le critère
                query = """
                SELECT j.id, j.title, j.company_id, c.name as company_name, j.location, 
                       j.matching_score, j.status, j.date_posted
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM transport_data t
                    JOIN user_locations l ON t.location_id = l.id
                    WHERE t.job_id = j.id
                    AND t.travel_mode = 'public_transport'
                    AND (t.travel_time > ? OR t.travel_time IS NULL)
                )
                AND EXISTS (
                    SELECT 1
                    FROM transport_data t
                    WHERE t.job_id = j.id
                )
                ORDER BY j.matching_score DESC
                """
            
            self.cursor.execute(query, (max_travel_time,))
            
            jobs = self.cursor.fetchall()
            
            # Récupérer les informations de transport pour chaque offre
            result = []
            for job in jobs:
                job_id = job[0]
                
                # Récupérer les données de transport pour chaque domicile
                self.cursor.execute("""
                SELECT t.location_id, l.name, t.travel_time, t.distance
                FROM transport_data t
                JOIN user_locations l ON t.location_id = l.id
                WHERE t.job_id = ? AND t.travel_mode = 'public_transport'
                ORDER BY t.travel_time
                """, (job_id,))
                
                transport_data = self.cursor.fetchall()
                
                locations_data = [
                    {
                        "location_id": data[0],
                        "location_name": data[1],
                        "travel_time": data[2],
                        "distance": data[3]
                    }
                    for data in transport_data
                ]
                
                result.append({
                    "job_id": job[0],
                    "title": job[1],
                    "company_id": job[2],
                    "company_name": job[3],
                    "location": job[4],
                    "matching_score": job[5],
                    "status": job[6],
                    "date_posted": job[7],
                    "transport_data": locations_data
                })
            
            condition = "au moins un domicile" if any_location else "tous les domiciles"
            logger.info(f"{len(result)} offres filtrées avec un temps de trajet <= {max_travel_time} minutes pour {condition}")
            
            return result
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors du filtrage des offres par temps de trajet: {e}")
            return []

    def close(self) -> None:
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Gestionnaire de domiciles multiples')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--list', help='Lister les domiciles', action='store_true')
    parser.add_argument('--add', help='Ajouter un domicile', action='store_true')
    parser.add_argument('--update', help='Mettre à jour un domicile', type=int)
    parser.add_argument('--delete', help='Supprimer un domicile', type=int)
    parser.add_argument('--name', help='Nom du domicile')
    parser.add_argument('--address', help='Adresse du domicile')
    parser.add_argument('--primary', help='Définir comme domicile principal', action='store_true')
    parser.add_argument('--job', help='ID de l\'offre pour afficher les données de transport', type=int)
    parser.add_argument('--max-time', help='Temps de trajet maximum en minutes', type=int, default=60)
    parser.add_argument('--any-location', help='Filtrer les offres où au moins un domicile respecte le critère', action='store_true')
    
    args = parser.parse_args()
    
    # Initialiser le gestionnaire de domiciles
    location_manager = LocationManager(args.db)
    
    if args.list:
        # Lister les domiciles
        locations = location_manager.get_user_locations()
        print(f"{len(locations)} domiciles configurés:")
        for loc in locations:
            primary = " (Principal)" if loc["is_primary"] else ""
            print(f"  - ID {loc['id']}: {loc['name']}{primary}: {loc['address']}")
    
    elif args.add:
        # Ajouter un domicile
        if not args.name or not args.address:
            print("Erreur: --name et --address sont requis pour ajouter un domicile")
        else:
            location_id = location_manager.add_user_location(args.name, args.address, args.primary)
            if location_id > 0:
                print(f"Domicile ajouté avec ID {location_id}")
            else:
                print("Erreur lors de l'ajout du domicile")
    
    elif args.update:
        # Mettre à jour un domicile
        if not args.name and not args.address and args.primary is None:
            print("Erreur: au moins un paramètre à mettre à jour est requis (--name, --address, --primary)")
        else:
            success = location_manager.update_user_location(args.update, args.name, args.address, args.primary)
            if success:
                print(f"Domicile avec ID {args.update} mis à jour")
            else:
                print(f"Erreur lors de la mise à jour du domicile avec ID {args.update}")
    
    elif args.delete:
        # Supprimer un domicile
        success = location_manager.delete_user_location(args.delete)
        if success:
            print(f"Domicile avec ID {args.delete} supprimé")
        else:
            print(f"Erreur lors de la suppression du domicile avec ID {args.delete}")
    
    elif args.job:
        # Afficher les données de transport pour une offre
        transport_data = location_manager.get_transport_data_for_job(args.job)
        
        if "error" in transport_data:
            print(f"Erreur: {transport_data['error']}")
        else:
            print(f"Données de transport pour l'offre {transport_data['job_id']} - {transport_data['job_title']} ({transport_data['job_location']}):")
            
            for location_data in transport_data.get("locations_data", []):
                travel_time = f"{location_data['travel_time']} min" if location_data['travel_time'] else "Non disponible"
                distance = f"{location_data['distance']} km" if location_data['distance'] else "Non disponible"
                
                print(f"  - Depuis {location_data['location_name']}:")
                print(f"    Temps de trajet: {travel_time}")
                print(f"    Distance: {distance}")
                print(f"    Mode: {location_data['travel_mode']}")
                
                if location_data.get('route_details'):
                    route = location_data['route_details']
                    if route.get('steps'):
                        print(f"    Étapes:")
                        for i, step in enumerate(route['steps'], 1):
                            print(f"      {i}. {step['text']} ({step['mode']})")
    
    else:
        # Filtrer les offres par temps de trajet
        condition = "au moins un domicile" if args.any_location else "tous les domiciles"
        filtered_jobs = location_manager.filter_jobs_by_travel_time(args.max_time, args.any_location)
        
        print(f"{len(filtered_jobs)} offres filtrées avec un temps de trajet <= {args.max_time} minutes pour {condition}:")
        
        for job in filtered_jobs:
            print(f"  - {job['title']} chez {job['company_name']} ({job['location']})")
            print(f"    Score de matching: {job['matching_score']}")
            print(f"    Temps de trajet:")
            
            for location_data in job.get('transport_data', []):
                travel_time = f"{location_data['travel_time']} min" if location_data['travel_time'] else "Non disponible"
                print(f"      - Depuis {location_data['location_name']}: {travel_time}")
            
            print()
    
    # Fermer la connexion
    location_manager.close()
