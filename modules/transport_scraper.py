#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module de scraping Google Maps pour les temps de transport
Ce module permet de scraper les temps de transport entre le domicile de l'utilisateur
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
    Classe pour scraper les temps de transport entre le domicile de l'utilisateur
    et le lieu de l'offre d'emploi en utilisant Google Maps.
    """

    def __init__(self, db_path: str, home_location: str):
        """
        Initialisation du scraper de temps de transport.
        
        Args:
            db_path: Chemin vers la base de données SQLite
            home_location: Adresse du domicile de l'utilisateur
        """
        self.db_path = db_path
        self.home_location = home_location
        self.conn = None
        self.cursor = None
        self.driver = None
        
        # Connexion à la base de données
        self._connect_db()
        
        # Création des tables si elles n'existent pas
        self._create_tables_if_not_exist()
        
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

    def _create_tables_if_not_exist(self) -> None:
        """Crée les tables nécessaires si elles n'existent pas."""
        try:
            # Table des données de transport
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS transport_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                travel_time INTEGER,
                travel_mode TEXT,
                distance REAL,
                route_details TEXT,
                scrape_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE (job_id, travel_mode)
            )
            ''')
            
            self.conn.commit()
            logger.info("Tables créées avec succès")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la création des tables: {e}")
            raise

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

    def _build_maps_url(self, destination: str, mode: str = "transit") -> str:
        """
        Construit l'URL Google Maps pour le trajet.
        
        Args:
            destination: Adresse de destination
            mode: Mode de transport (transit, driving, walking, bicycling)
            
        Returns:
            URL Google Maps
        """
        # Encoder les adresses pour l'URL
        origin_encoded = urllib.parse.quote_plus(self.home_location)
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

    def scrape_transport_data(self, job_id: int, job_location: str) -> Dict[str, Any]:
        """
        Scrape les données de transport pour une offre d'emploi.
        
        Args:
            job_id: ID de l'offre d'emploi
            job_location: Localisation de l'offre d'emploi
            
        Returns:
            Dictionnaire contenant les données de transport
        """
        # Vérifier si les données existent déjà
        self.cursor.execute(
            "SELECT * FROM transport_data WHERE job_id = ? AND travel_mode = 'public_transport'",
            (job_id,)
        )
        existing_data = self.cursor.fetchone()
        
        if existing_data:
            logger.info(f"Données de transport déjà existantes pour l'offre {job_id}")
            return {
                "job_id": job_id,
                "travel_time": existing_data[2],
                "travel_mode": existing_data[3],
                "distance": existing_data[4],
                "route_details": json.loads(existing_data[5]) if existing_data[5] else None,
                "scrape_url": existing_data[6]
            }
        
        # Construire l'URL Google Maps
        url = self._build_maps_url(job_location, mode="transit")
        
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
                "travel_time": travel_time,
                "travel_mode": "public_transport",
                "distance": distance,
                "route_details": route_details,
                "scrape_url": url
            }
            
            # Sauvegarder les données dans la base de données
            self._save_transport_data(result)
            
            # Ajouter un délai aléatoire pour éviter d'être bloqué
            time.sleep(random.uniform(1.0, 3.0))
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping des données de transport: {e}")
            
            # Sauvegarder une entrée vide pour éviter de réessayer
            empty_result = {
                "job_id": job_id,
                "travel_time": None,
                "travel_mode": "public_transport",
                "distance": None,
                "route_details": None,
                "scrape_url": url
            }
            self._save_transport_data(empty_result)
            
            return empty_result

    def _save_transport_data(self, data: Dict[str, Any]) -> None:
        """
        Sauvegarde les données de transport dans la base de données.
        
        Args:
            data: Dictionnaire contenant les données de transport
        """
        try:
            self.cursor.execute('''
            INSERT OR REPLACE INTO transport_data (
                job_id, travel_time, travel_mode, distance, route_details, scrape_url
            ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                data["job_id"],
                data["travel_time"],
                data["travel_mode"],
                data["distance"],
                json.dumps(data["route_details"]) if data["route_details"] else None,
                data["scrape_url"]
            ))
            
            self.conn.commit()
            logger.info(f"Données de transport sauvegardées pour l'offre {data['job_id']}")
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la sauvegarde des données de transport: {e}")
            self.conn.rollback()

    def process_jobs_without_transport_data(self, limit: int = 10) -> int:
        """
        Traite les offres d'emploi sans données de transport.
        
        Args:
            limit: Nombre maximum d'offres à traiter
            
        Returns:
(Content truncated due to size limit. Use line ranges to read in chunks)
"""