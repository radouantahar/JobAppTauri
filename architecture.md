# Schéma d'Architecture - Application d'Automatisation de Recherche d'Emploi

## Vue d'ensemble

L'application est conçue comme une solution desktop locale qui automatise le processus de recherche d'emploi, depuis le scraping des offres jusqu'à la génération de documents personnalisés. Tous les traitements sont effectués localement, sans appel à des API externes, en utilisant des outils open source.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Application Desktop (Electron/Tauri)               │
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
- **Framework**: Electron.js ou Tauri (Rust + frontend web)
- **Interface Kanban**: Intégration avec NocoDB existant (Docker)
- **Fonctionnalités**:
  - Affichage des offres dans une interface Kanban
  - Gestion des colonnes (Backlog, To Be Reviewed, For Application, etc.)
  - Visualisation des scores de matching et des détails des offres
  - Interface de configuration du profil utilisateur

### 2. Module de Scraping
- **Scraping d'Offres d'Emploi**:
  - Utilisation de JobSpy pour scraper LinkedIn, Indeed, Glassdoor, etc.
  - Extraction des offres d'emploi avec leurs détails (titre, entreprise, lieu, description, etc.)
  - Stockage des résultats dans la base SQLite

- **Scraping de Temps de Transport**:
  - Utilisation de Selenium/Playwright pour scraper Google Maps
  - Construction d'URL du type: `https://www.google.com/maps/dir/{Domicile}/{Job city}/`
  - Extraction des temps de trajet multimodaux (train, métro, tram)
  - Intégration des résultats dans le processus de filtrage des offres

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

### 4. Module de Génération de Documents
- **Génération de Contenu**:
  - Utilisation d'Ollama (LLM local) pour générer des lettres de motivation et CV personnalisés
  - Templates de prompts prédéfinis pour la génération
  - Création de fichiers .docx via python-docx

### 5. Scheduler et Automatisation
- **Scheduler Local**:
  - Utilisation de cron pour planifier les tâches de scraping
  - Exécution périodique (quotidienne ou hebdomadaire) des tâches de scraping
  - Notification des nouvelles offres correspondant au profil

## Flux de Données

1. **Configuration Initiale**:
   - L'utilisateur configure son profil via un fichier YAML/JSON
   - Le système extrait les données du CV au format PDF

2. **Scraping et Collecte**:
   - Le module de scraping collecte les offres d'emploi via JobSpy
   - Les offres sont stockées dans la base SQLite

3. **Enrichissement et Filtrage**:
   - Pour chaque offre, le système scrape Google Maps pour obtenir le temps de transport
   - Les offres sont filtrées selon les critères (temps > 1h, salaire < 50K€)

4. **Scoring et Matching**:
   - Le système calcule un score de matching pour chaque offre
   - Les offres sont classées selon leur score et affichées dans l'interface Kanban

5. **Génération de Documents**:
   - Lorsqu'une offre est déplacée vers "For Application", le système génère:
     - Une lettre de motivation personnalisée
     - Un CV adapté à l'offre

## Stockage de Données

### Base de Données SQLite
- **Tables Principales**:
  - `jobs`: Stockage des offres d'emploi scrapées
  - `companies`: Informations sur les entreprises
  - `user_profile`: Profil de l'utilisateur
  - `applications`: Suivi des candidatures
  - `transport_data`: Données de temps de transport

### NocoDB
- Utilisation de l'instance NocoDB existante pour l'interface Kanban
- Configuration des vues et des colonnes selon les besoins du projet

## Déploiement et Conteneurisation

- **Docker**:
  - Utilisation des conteneurs Docker existants pour NocoDB et Ollama
  - Possibilité d'ajouter des conteneurs supplémentaires pour d'autres services

- **Installation Locale**:
  - Scripts d'installation pour les dépendances Python
  - Configuration de l'environnement de développement

## Sécurité et Confidentialité

- Toutes les données sont stockées localement
- Aucune information n'est envoyée à des serveurs externes
- Les données sensibles (CV, lettres de motivation) restent sur la machine de l'utilisateur

## Extensions Futures

- **Boucle de Feedback**:
  - Apprentissage à partir des offres rejetées pour améliorer le scoring
  - Ajustement automatique des critères de matching

- **Recherche Sémantique Avancée**:
  - Intégration possible de Haystack + Qdrant pour des recherches plus précises

- **Plugin de Scraping Configurable**:
  - Système de configuration YAML pour ajouter facilement de nouveaux sites à scraper
