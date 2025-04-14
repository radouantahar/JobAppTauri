# Schéma d'Architecture - Application d'Automatisation de Recherche d'Emploi

## Vue d'ensemble

L'application est conçue comme une solution desktop locale qui automatise le processus de recherche d'emploi, depuis le scraping des offres jusqu'à la génération de documents personnalisés. Tous les traitements sont effectués localement, sans appel à des API externes, en utilisant des outils open source.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Application Desktop (Tauri)                        │
├─────────────┬─────────────┬────────────────┬────────────┬───────────────┤
│  Interface  │  Scraping   │   Matching &   │ Génération │  Scheduler    │
│   Kanban    │   Module    │    Scoring     │ Documents  │   (cron)      │
│  (NocoDB)   │             │                │            │               │
├─────────────┼─────────────┼────────────────┼────────────┼───────────────┤
│             │             │                │            │               │
│  SQLite DB  │  JobSpy     │  LLM Local     │  Ollama    │  Docker       │
│             │  Selenium   │  (Embeddings)  │            │  Containers   │
└─────────────┴─────────────┴────────────────┴────────────┴───────────────┘
```

## Composants Principaux

### 1. Interface Utilisateur
- **Framework**: Tauri (Rust + React/TypeScript)
- **Interface Kanban**: Intégration avec NocoDB existant (Docker)
- **Fonctionnalités**:
  - Affichage des offres dans une interface Kanban
  - Gestion des colonnes (Backlog, To Be Reviewed, For Application, etc.)
  - Visualisation des scores de matching et des détails des offres
  - Interface de configuration du profil utilisateur
  - Gestion des préférences de recherche
  - Visualisation des temps de trajet

### 2. Module de Scraping
- **Scraping d'Offres d'Emploi**:
  - Utilisation de JobSpy pour scraper LinkedIn, Indeed, Glassdoor, etc.
  - Extraction des offres d'emploi avec leurs détails (titre, entreprise, lieu, description, etc.)
  - Stockage des résultats dans la base SQLite
  - Détection des doublons avec difflib et fuzzywuzzy

- **Scraping de Temps de Transport**:
  - Utilisation de Selenium/Playwright pour scraper Google Maps
  - Construction d'URL du type: `https://www.google.com/maps/dir/{Domicile}/{Job city}/`
  - Extraction des temps de trajet multimodaux (train, métro, tram)
  - Intégration des résultats dans le processus de filtrage des offres
  - Support de plusieurs adresses de domicile

### 3. Module de Matching et Scoring
- **Extraction du Profil**:
  - Parsing du CV au format PDF (utilisation de PyPDF2 ou pdfminer)
  - Extraction des compétences, expériences, formations, etc.
  - Lecture du fichier de configuration YAML/JSON pour les préférences

- **Scoring des Offres**:
  - Utilisation d'embeddings via LLM local (Ollama)
  - Calcul de similarité sémantique entre le profil et les offres
  - Pondération basée sur les critères de préférence utilisateur
  - Filtrage des offres selon les critères (temps de transport, salaire)
  - Analyse des doublons et fusion des informations

### 4. Module de Génération de Documents
- **Génération de Contenu**:
  - Utilisation d'Ollama (LLM local) pour générer des lettres de motivation et CV personnalisés
  - Templates de prompts prédéfinis pour la génération
  - Création de fichiers .docx via python-docx
  - Support de plusieurs formats de sortie (PDF, DOCX, TXT)

### 5. Modules à Implémenter

#### 5.1 Modules de Base
- **Détection des Doublons** (`duplicate_detector.py`):
  - Analyse de similarité textuelle avec difflib et fuzzywuzzy
  - Détection par URL et contenu
  - Fusion des informations complémentaires
  - Historique des doublons
  - Interface de gestion des doublons

- **Gestion des Domiciles** (`location_manager.py`):
  - Stockage de plusieurs adresses de domicile
  - Géocodage des adresses avec geopy
  - Validation des adresses
  - Préférences de transport par domicile
  - Visualisation des trajets avec folium

#### 5.2 Modules d'Analyse
- **Préférences de Recherche** (`search_preferences.py`):
  - Gestion des catégories de mots-clés
  - Pondération personnalisable avec numpy
  - Ensembles de préférences multiples
  - Historique des recherches
  - Analyse des résultats avec pandas

- **Suggestions IA** (`ai_suggestions.py`):
  - Analyse du CV avec LLM
  - Suggestions de mots-clés pertinents
  - Identification des postes adaptés
  - Recommandations d'entreprises
  - Calcul de similarité avec scikit-learn

#### 5.3 Modules Avancés
- **Analyse du Feedback Kanban** (`kanban_feedback.py`):
  - Analyse des offres acceptées/refusées
  - Extraction de patterns avec scikit-learn
  - Ajustement automatique des pondérations
  - Optimisation des mots-clés
  - Visualisation des tendances avec matplotlib

- **Gestion des API LLM** (`llm_api_manager.py`):
  - Support d'Ollama local
  - Intégration d'API alternatives
  - Gestion des coûts et quotas
  - Basculement automatique
  - Gestion des retries avec tenacity

### 6. Scheduler et Automatisation
- **Scheduler Local**:
  - Utilisation de cron pour planifier les tâches de scraping
  - Exécution périodique (quotidienne ou hebdomadaire) des tâches de scraping
  - Notification des nouvelles offres correspondant au profil
  - Gestion des erreurs et des retries

## Flux de Données

1. **Configuration Initiale**:
   - L'utilisateur configure son profil via l'interface Tauri
   - Le système extrait les données du CV au format PDF
   - Configuration des préférences de recherche et des domiciles

2. **Scraping et Collecte**:
   - Le module de scraping collecte les offres d'emploi via JobSpy
   - Les offres sont stockées dans la base SQLite
   - Détection et gestion des doublons
   - Calcul des temps de trajet pour chaque offre

3. **Enrichissement et Filtrage**:
   - Pour chaque offre, le système scrape Google Maps pour obtenir le temps de transport
   - Les offres sont filtrées selon les critères (temps > 1h, salaire < 50K€)
   - Analyse des doublons et fusion des informations
   - Génération de suggestions basées sur le profil

4. **Scoring et Matching**:
   - Le système calcule un score de matching pour chaque offre
   - Les offres sont classées selon leur score et affichées dans l'interface Kanban
   - Analyse du feedback Kanban pour améliorer les suggestions
   - Ajustement des pondérations en fonction des préférences

5. **Génération de Documents**:
   - Lorsqu'une offre est déplacée vers "For Application", le système génère:
     - Une lettre de motivation personnalisée
     - Un CV adapté à l'offre
   - Support de plusieurs formats de sortie
   - Intégration avec l'interface Tauri

## Stockage de Données

### Base de Données SQLite
- **Tables Principales**:
  - `jobs`: Stockage des offres d'emploi scrapées
  - `companies`: Informations sur les entreprises
  - `user_profile`: Profil de l'utilisateur
  - `applications`: Suivi des candidatures
  - `transport_data`: Données de temps de transport
  - `duplicate_jobs`: Gestion des doublons
  - `user_locations`: Adresses de domicile
  - `search_preferences`: Préférences de recherche
  - `ai_suggestions`: Suggestions générées
  - `kanban_feedback`: Analyse du feedback

### NocoDB
- Utilisation de l'instance NocoDB existante pour l'interface Kanban
- Configuration des vues et des colonnes selon les besoins du projet
- Synchronisation avec la base SQLite

## Déploiement et Conteneurisation

- **Docker**:
  - Utilisation des conteneurs Docker existants pour NocoDB et Ollama
  - Possibilité d'ajouter des conteneurs supplémentaires pour d'autres services

- **Installation Locale**:
  - Scripts d'installation pour les dépendances Python
  - Configuration de l'environnement de développement
  - Packaging avec Tauri CLI

## Sécurité et Confidentialité

- Toutes les données sont stockées localement
- Aucune information n'est envoyée à des serveurs externes
- Les données sensibles (CV, lettres de motivation) restent sur la machine de l'utilisateur
- Sécurité renforcée avec Tauri (sandboxing, permissions explicites)

## Extensions Futures

- **Boucle de Feedback**:
  - Apprentissage à partir des offres rejetées pour améliorer le scoring
  - Ajustement automatique des critères de matching

- **Recherche Sémantique Avancée**:
  - Intégration possible de Haystack + Qdrant pour des recherches plus précises

- **Plugin de Scraping Configurable**:
  - Système de configuration YAML pour ajouter facilement de nouveaux sites à scraper

- **Analyse de Marché**:
  - Visualisation des tendances du marché de l'emploi
  - Analyse des salaires par secteur et région
  - Prédiction des opportunités futures
