#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de scraping Google Maps pour les temps de transport (version améliorée)
Ce module permet de scraper les temps de transport entre les domiciles de l'utilisateur
et le lieu de l'offre d'emploi en utilisant Google Maps.
"""

import os
import re
import json
import time
import random
import logging
import sqlite3
import urllib.parse
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Bibliothèques pour le scraping
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TransportScraper:
    """
    Classe pour scraper les temps de transport entre les domiciles de l'utilisateur
    et le lieu de l'offre d'emploi en utilisant Google Maps.
    """

    def __init__(self, db_path: str):
        """
        Initialisation du scraper de temps de transport.
        
        Args:
            db_path: Chemin vers la base de données SQLite
        """
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.driver = None
        self.user_locations = []
        
        # Connexion à la base de données
        self._connect_db()
        
        # Chargement des domiciles de l'utilisateur
        self._load_user_locations()
        
        # Initialisation du navigateur
        self._init_browser()

    def _connect_db(self) -> None:
        """Établit une connexion à la base de données SQLite."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logger.info(f"Connexion à la base de données {self.db_path} établie")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la connexion à la base de données: {e}")
            raise

    def _load_user_locations(self) -> None:
        """Charge les domiciles de l'utilisateur depuis la base de données."""
        try:
            # Vérifier si la table user_locations existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_locations'
            """)
            
            if not self.cursor.fetchone():
                logger.warning("La table user_locations n'existe pas encore")
                # Créer un domicile par défaut si la table n'existe pas
                self._create_default_location()
                return
                
            # Charger les domiciles
            self.cursor.execute("""
            SELECT id, name, address, is_primary 
            FROM user_locations 
            WHERE user_id = (SELECT id FROM user_profile LIMIT 1)
            ORDER BY is_primary DESC
            """)
            
            locations = self.cursor.fetchall()
            
            if not locations:
                logger.warning("Aucun domicile trouvé pour l'utilisateur")
                # Créer un domicile par défaut
                self._create_default_location()
                return
                
            # Convertir en liste de dictionnaires
            self.user_locations = [
                {
                    "id": loc[0],
                    "name": loc[1],
                    "address": loc[2],
                    "is_primary": bool(loc[3])
                }
                for loc in locations
            ]
            
            logger.info(f"{len(self.user_locations)} domiciles chargés")
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors du chargement des domiciles: {e}")
            # Créer un domicile par défaut en cas d'erreur
            self._create_default_location()

    def _create_default_location(self) -> None:
        """Crée un domicile par défaut si aucun n'existe."""
        try:
            # Vérifier si la table user_locations existe
            self.cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_locations'
            """)
            
            if not self.cursor.fetchone():
                # Créer la table si elle n'existe pas
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
                
            # Récupérer l'ID de l'utilisateur
            self.cursor.execute("SELECT id FROM user_profile LIMIT 1")
            user_id = self.cursor.fetchone()
            
            if not user_id:
                logger.error("Aucun profil utilisateur trouvé")
                return
                
            user_id = user_id[0]
            
            # Vérifier si un domicile principal existe déjà
            self.cursor.execute("""
            SELECT id FROM user_locations 
            WHERE user_id = ? AND is_primary = 1
            """, (user_id,))
            
            if not self.cursor.fetchone():
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
                
                # Recharger les domiciles
                self._load_user_locations()
                
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des domiciles par défaut: {e}")
            self.conn.rollback()

    def _init_browser(self) -> None:
        """Initialise le navigateur Chrome en mode headless."""
        try:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--lang=fr-FR")
            
            self.driver = webdriver.Chrome(options=options)
            logger.info("Navigateur Chrome initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du navigateur: {e}")
            raise

    def _build_maps_url(self, origin: str, destination: str, mode: str = "transit") -> str:
        """
        Construit l'URL Google Maps pour le trajet.
        
        Args:
            origin: Adresse d'origine
            destination: Adresse de destination
            mode: Mode de transport (transit, driving, walking, bicycling)
            
        Returns:
            URL Google Maps
        """
        # Encoder les adresses pour l'URL
        origin_encoded = urllib.parse.quote_plus(origin)
        destination_encoded = urllib.parse.quote_plus(destination)
        
        # Construire l'URL
        url = f"https://www.google.com/maps/dir/{origin_encoded}/{destination_encoded}/"
        
        # Ajouter le mode de transport
        if mode == "transit":
            url += "data=!4m2!4m1!3e3"  # Transit public
        elif mode == "driving":
            url += "data=!4m2!4m1!3e0"  # Voiture
        elif mode == "walking":
            url += "data=!4m2!4m1!3e2"  # À pied
        elif mode == "bicycling":
            url += "data=!4m2!4m1!3e1"  # Vélo
            
        return url

    def _extract_travel_time(self) -> Optional[int]:
        """
        Extrait le temps de trajet de la page Google Maps.
        
        Returns:
            Temps de trajet en minutes ou None si non trouvé
        """
        try:
            # Attendre que les résultats de trajet soient chargés
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[jsan*='t-transit-time']"))
            )
            
            # Extraire le temps de trajet
            time_element = self.driver.find_element(By.CSS_SELECTOR, "div[jsan*='t-transit-time']")
            time_text = time_element.text.strip()
            
            # Convertir en minutes
            minutes = 0
            
            # Pattern pour "X h Y min"
            hours_minutes_match = re.search(r"(\d+)\s*h\s*(\d+)\s*min", time_text)
            if hours_minutes_match:
                hours = int(hours_minutes_match.group(1))
                mins = int(hours_minutes_match.group(2))
                minutes = hours * 60 + mins
            else:
                # Pattern pour "X h" seulement
                hours_match = re.search(r"(\d+)\s*h", time_text)
                if hours_match:
                    hours = int(hours_match.group(1))
                    minutes = hours * 60
                else:
                    # Pattern pour "X min" seulement
                    minutes_match = re.search(r"(\d+)\s*min", time_text)
                    if minutes_match:
                        minutes = int(minutes_match.group(1))
            
            return minutes
        except (TimeoutException, NoSuchElementException) as e:
            logger.warning(f"Impossible d'extraire le temps de trajet: {e}")
            return None

    def _extract_distance(self) -> Optional[float]:
        """
        Extrait la distance de la page Google Maps.
        
        Returns:
            Distance en kilomètres ou None si non trouvée
        """
        try:
            # Attendre que les résultats de trajet soient chargés
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[jsan*='t-transit-distance']"))
            )
            
            # Extraire la distance
            distance_element = self.driver.find_element(By.CSS_SELECTOR, "div[jsan*='t-transit-distance']")
            distance_text = distance_element.text.strip()
            
            # Convertir en kilomètres
            km_match = re.search(r"([\d,\.]+)\s*km", distance_text)
            if km_match:
                # Remplacer la virgule par un point pour la conversion en float
                distance_str = km_match.group(1).replace(',', '.')
                return float(distance_str)
            
            # Si la distance est en mètres
            m_match = re.search(r"([\d,\.]+)\s*m", distance_text)
            if m_match:
                distance_str = m_match.group(1).replace(',', '.')
                return float(distance_str) / 1000  # Convertir en km
                
            return None
        except (TimeoutException, NoSuchElementException) as e:
            logger.warning(f"Impossible d'extraire la distance: {e}")
            return None

    def _extract_route_details(self) -> Optional[Dict[str, Any]]:
        """
        Extrait les détails de l'itinéraire de la page Google Maps.
        
        Returns:
            Dictionnaire contenant les détails de l'itinéraire ou None si non trouvés
        """
        try:
            # Attendre que les détails de l'itinéraire soient chargés
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='listbox']"))
            )
            
            # Extraire les étapes de l'itinéraire
            steps_elements = self.driver.find_elements(By.CSS_SELECTOR, "div[role='listbox'] > div")
            
            steps = []
            for step_element in steps_elements:
                step_text = step_element.text.strip()
                if step_text:
                    # Extraire le mode de transport de cette étape
                    transport_mode = "unknown"
                    if "métro" in step_text.lower() or "ligne" in step_text.lower():
                        transport_mode = "metro"
                    elif "bus" in step_text.lower():
                        transport_mode = "bus"
                    elif "train" in step_text.lower() or "rer" in step_text.lower():
                        transport_mode = "train"
                    elif "tram" in step_text.lower():
                        transport_mode = "tram"
                    elif "marche" in step_text.lower() or "à pied" in step_text.lower():
                        transport_mode = "walking"
                        
                    steps.append({
                        "text": step_text,
                        "mode": transport_mode
                    })
            
            # Extraire les informations de départ et d'arrivée
            departure_time = None
            arrival_time = None
            
            time_elements = self.driver.find_elements(By.CSS_SELECTOR, "div[jsan*='transit-time']")
            if len(time_elements) >= 2:
                departure_time = time_elements[0].text.strip()
                arrival_time = time_elements[1].text.strip()
            
            return {
                "steps": steps,
                "departure_time": departure_time,
                "arrival_time": arrival_time
            }
        except (TimeoutException, NoSuchElementException) as e:
            logger.warning(f"Impossible d'extraire les détails de l'itinéraire: {e}")
            return None

    def _handle_cookies_popup(self) -> None:
        """Gère la popup de cookies si elle apparaît."""
        try:
            # Attendre que la popup de cookies apparaisse
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "button[aria-label*='Tout accepter']"))
            )
            
            # Cliquer sur le bouton "Tout accepter"
            accept_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='Tout accepter']")
            accept_button.click()
            
            logger.info("Popup de cookies acceptée")
        except TimeoutException:
            # La popup n'est pas apparue, ce n'est pas un problème
            logger.info("Pas de popup de cookies détectée")

    def scrape_transport_data(self, job_id: int, job_location: str, location_id: int = None) -> Dict[str, Any]:
        """
        Scrape les données de transport pour une offre d'emploi depuis un domicile spécifique.
        
        Args:
            job_id: ID de l'offre d'emploi
            job_location: Localisation de l'offre d'emploi
            location_id: ID du domicile (si None, tous les domiciles seront utilisés)
            
        Returns:
            Dictionnaire contenant les données de transport
        """
        results = []
        
        # Déterminer quels domiciles utiliser
        locations_to_use = []
        if location_id:
            # Utiliser un domicile spécifique
            locations_to_use = [loc for loc in self.user_locations if loc["id"] == location_id]
            if not locations_to_use:
                logger.error(f"Domicile avec ID {location_id} non trouvé")
                return {"error": f"Domicile avec ID {location_id} non trouvé"}
        else:
            # Utiliser tous les domiciles
            locations_to_use = self.user_locations
        
        for location in locations_to_use:
            # Vérifier si les données existent déjà
            self.cursor.execute(
                """
                SELECT * FROM transport_data 
                WHERE job_id = ? AND location_id = ? AND travel_mode = 'public_transport'
                """,
                (job_id, location["id"])
            )
            existing_data = self.cursor.fetchone()
            
            if existing_data:
                logger.info(f"Données de transport déjà existantes pour l'offre {job_id} depuis {location['name']}")
                
                # Convertir en dictionnaire
                columns = [column[0] for column in self.cursor.description]
                result = dict(zip(columns, existing_data))
                
                # Ajouter les informations du domicile
                result["location_name"] = location["name"]
                result["location_address"] = location["address"]
                
                results.append(result)
                continue
            
            # Construire l'URL Google Maps
            url = self._build_maps_url(location["address"], job_location, mode="transit")
            
            try:
                # Naviguer vers l'URL
                logger.info(f"Navigation vers {url}")
                self.driver.get(url)
                
                # Gérer la popup de cookies si elle apparaît
                self._handle_cookies_popup()
                
                # Attendre que la page se charge complètement
                time.sleep(2)
                
                # Extraire les données
                travel_time = self._extract_travel_time()
                distance = self._extract_distance()
                route_details = self._extract_route_details()
                
                # Créer le dictionnaire de résultats
                result = {
                    "job_id": job_id,
                    "location_id": location["id"],
                    "location_name": location["name"],
                    "location_address": location["address"],
                    "travel_time": travel_time,
                    "travel_mode": "public_transport",
                    "distance": distance,
                    "route_details": route_details,
                    "scrape_url": url
                }
                
                # Sauvegarder les données dans la base de données
                self._save_transport_data(result)
                
                # Ajouter aux résultats
                results.append(result)
                
                # Ajouter un délai aléatoire pour éviter d'être bloqué
                time.sleep(random.uniform(1.0, 3.0))
                
            except Exception as e:
                logger.error(f"Erreur lors du scraping des données de transport depuis {location['name']}: {e}")
                
                # Sauvegarder une entrée vide pour éviter de réessayer
                empty_result = {
                    "job_id": job_id,
                    "location_id": location["id"],
                    "location_name": location["name"],
                    "location_address": location["address"],
                    "travel_time": None,
                    "travel_mode": "public_transport",
                    "distance": None,
                    "route_details": None,
                    "scrape_url": url
                }
                self._save_transport_data(empty_result)
                
                # Ajouter aux résultats
                results.append(empty_result)
        
        return {
            "job_id": job_id,
            "job_location": job_location,
            "results": results
        }

    def _save_transport_data(self, data: Dict[str, Any]) -> None:
        """
        Sauvegarde les données de transport dans la base de données.
        
        Args:
            data: Dictionnaire contenant les données de transport
        """
        try:
            self.cursor.execute('''
            INSERT OR REPLACE INTO transport_data (
                job_id, location_id, travel_time, travel_mode, distance, route_details, scrape_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                data["job_id"],
                data["location_id"],
                data["travel_time"],
                data["travel_mode"],
                data["distance"],
                json.dumps(data["route_details"]) if data["route_details"] else None,
                data["scrape_url"]
            ))
            
            self.conn.commit()
            logger.info(f"Données de transport sauvegardées pour l'offre {data['job_id']} depuis {data['location_name']}")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la sauvegarde des données de transport: {e}")
            self.conn.rollback()

    def process_jobs_without_transport_data(self, limit: int = 10) -> int:
        """
        Traite les offres d'emploi sans données de transport.
        
        Args:
            limit: Nombre maximum d'offres à traiter
            
        Returns:
            Nombre d'offres traitées
        """
        try:
            # Récupérer les offres sans données de transport pour au moins un domicile
            self.cursor.execute('''
            SELECT j.id, j.location
            FROM jobs j
            WHERE j.id NOT IN (
                SELECT DISTINCT t.job_id
                FROM transport_data t
                GROUP BY t.job_id
                HAVING COUNT(DISTINCT t.location_id) >= ?
            )
            AND j.location IS NOT NULL
            LIMIT ?
            ''', (len(self.user_locations), limit))
            
            jobs = self.cursor.fetchall()
            
            processed_count = 0
            for job_id, location in jobs:
                if not location:
                    logger.warning(f"Localisation manquante pour l'offre {job_id}")
                    continue
                    
                logger.info(f"Traitement de l'offre {job_id} avec localisation {location}")
                self.scrape_transport_data(job_id, location)
                processed_count += 1
                
            return processed_count
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des offres sans données de transport: {e}")
            return 0

    def filter_jobs_by_travel_time(self, max_travel_time: int = 60, any_location: bool = True) -> List[int]:
        """
        Filtre les offres d'emploi par temps de trajet.
        
        Args:
            max_travel_time: Temps de trajet maximum en minutes
            any_location: Si True, inclut les offres où au moins un domicile respecte le critère
                          Si False, inclut uniquement les offres où tous les domiciles respectent le critère
            
        Returns:
            Liste des IDs des offres d'emploi filtrées
        """
        try:
            query = ""
            
            if any_location:
                # Offres où au moins un domicile respecte le critère
                query = '''
                SELECT DISTINCT j.id
                FROM jobs j
                JOIN transport_data t ON j.id = t.job_id AND t.travel_mode = 'public_transport'
                WHERE t.travel_time <= ?
                '''
            else:
                # Offres où tous les domiciles respectent le critère
                query = '''
                SELECT j.id
                FROM jobs j
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
                '''
            
            self.cursor.execute(query, (max_travel_time,))
            
            filtered_jobs = [row[0] for row in self.cursor.fetchall()]
            
            condition = "au moins un domicile" if any_location else "tous les domiciles"
            logger.info(f"{len(filtered_jobs)} offres filtrées avec un temps de trajet <= {max_travel_time} minutes pour {condition}")
            
            return filtered_jobs
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors du filtrage des offres par temps de trajet: {e}")
            return []

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
            self.cursor.execute('''
            SELECT t.location_id, l.name, t.travel_time, t.distance
            FROM transport_data t
            JOIN user_locations l ON t.location_id = l.id
            WHERE t.job_id = ? AND t.travel_mode = 'public_transport'
            ORDER BY t.travel_time
            ''', (job_id,))
            
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
                "travel_time": best_location[2],
                "distance": best_location[3]
            }
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la détermination du meilleur domicile: {e}")
            return {"error": str(e)}

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
            user_id = self.cursor.fetchone()
            
            if not user_id:
                logger.error("Aucun profil utilisateur trouvé")
                return -1
                
            user_id = user_id[0]
            
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
            
            # Recharger les domiciles
            self._load_user_locations()
            
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
            if update_is_primary:
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
            
            # Recharger les domiciles
            self._load_user_locations()
            
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
            
            # Recharger les domiciles
            self._load_user_locations()
            
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la suppression du domicile: {e}")
            self.conn.rollback()
            return False

    def get_user_locations(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des domiciles de l'utilisateur.
        
        Returns:
            Liste des domiciles
        """
        return self.user_locations

    def close(self) -> None:
        """Ferme les connexions et libère les ressources."""
        if self.driver:
            self.driver.quit()
            logger.info("Navigateur fermé")
            
        if self.conn:
            self.conn.close()
            logger.info("Connexion à la base de données fermée")


# Exemple d'utilisation
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scraper de temps de transport Google Maps')
    parser.add_argument('--db', help='Chemin vers la base de données SQLite', default='jobs.db')
    parser.add_argument('--limit', help='Nombre maximum d\'offres à traiter', type=int, default=10)
    parser.add_argument('--max-time', help='Temps de trajet maximum en minutes', type=int, default=60)
    parser.add_argument('--any-location', help='Filtrer les offres où au moins un domicile respecte le critère', action='store_true')
    parser.add_argument('--add-location', help='Ajouter un nouveau domicile', action='store_true')
    parser.add_argument('--name', help='Nom du domicile')
    parser.add_argument('--address', help='Adresse du domicile')
    parser.add_argument('--primary', help='Définir comme domicile principal', action='store_true')
    
    args = parser.parse_args()
    
    # Initialiser le scraper
    scraper = TransportScraper(args.db)
    
    if args.add_location:
        if not args.name or not args.address:
            print("Erreur: --name et --address sont requis pour ajouter un domicile")
        else:
            location_id = scraper.add_user_location(args.name, args.address, args.primary)
            if location_id > 0:
                print(f"Domicile ajouté avec ID {location_id}")
            else:
                print("Erreur lors de l'ajout du domicile")
    else:
        # Afficher les domiciles
        locations = scraper.get_user_locations()
        print(f"{len(locations)} domiciles configurés:")
        for loc in locations:
            primary = " (Principal)" if loc["is_primary"] else ""
            print(f"  - {loc['name']}{primary}: {loc['address']}")
        
        # Traiter les offres sans données de transport
        processed_count = scraper.process_jobs_without_transport_data(args.limit)
        print(f"{processed_count} offres traitées")
        
        # Filtrer les offres par temps de trajet
        condition = "au moins un domicile" if args.any_location else "tous les domiciles"
        filtered_jobs = scraper.filter_jobs_by_travel_time(args.max_time, args.any_location)
        print(f"{len(filtered_jobs)} offres filtrées avec un temps de trajet <= {args.max_time} minutes pour {condition}")
    
    # Fermer les connexions
    scraper.close()
