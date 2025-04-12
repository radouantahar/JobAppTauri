# Documentation de l'Application d'Automatisation de Recherche d'Emploi

## Table des matières
1. [Introduction](#introduction)
2. [Architecture de la solution](#architecture-de-la-solution)
3. [Stack technique](#stack-technique)
4. [Schéma de données](#schéma-de-données)
5. [Modules principaux](#modules-principaux)
6. [Installation et configuration](#installation-et-configuration)
7. [Utilisation](#utilisation)
8. [Personnalisation](#personnalisation)
9. [Dépannage](#dépannage)

## Introduction

Cette application d'automatisation de recherche d'emploi est conçue pour simplifier et optimiser le processus de recherche d'emploi en automatisant plusieurs tâches chronophages. Elle permet de :

- Scraper automatiquement les offres d'emploi de différentes plateformes
- Analyser les CV au format PDF
- Calculer les temps de transport entre le domicile et le lieu de travail
- Évaluer la pertinence des offres par rapport au profil de l'utilisateur
- Générer des CV et lettres de motivation personnalisés
- Gérer les candidatures via une interface Kanban (NocoDB)

L'application est entièrement locale, respectant ainsi la vie privée de l'utilisateur, et utilise un LLM local (via Ollama) pour les tâches d'analyse et de génération de contenu.

## Architecture de la solution

L'architecture de l'application est modulaire, composée de plusieurs composants indépendants qui communiquent entre eux via une base de données SQLite centrale.

![Architecture](architecture.png)

Les principaux composants sont :

1. **Module de scraping d'offres d'emploi** : Collecte les offres depuis diverses plateformes
2. **Module de parsing de CV** : Extrait les informations structurées des CV au format PDF
3. **Module de calcul des temps de transport** : Évalue les temps de trajet domicile-travail
4. **Module de matching et scoring** : Calcule la pertinence des offres par rapport au profil
5. **Module de génération de contenu** : Crée des CV et lettres de motivation personnalisés
6. **Module d'intégration NocoDB** : Synchronise les données avec l'interface Kanban

## Stack technique

L'application utilise les technologies suivantes :

- **Langages** : Python 3.10+
- **Base de données** : SQLite
- **Scraping** : JobSpy, Selenium
- **Parsing de documents** : pdfminer.six, spaCy
- **LLM local** : Ollama (avec modèle llama3:8b)
- **Interface Kanban** : NocoDB (Docker)
- **Génération de documents** : python-docx
- **Embeddings** : sentence-transformers

## Schéma de données

La base de données SQLite centrale contient les tables suivantes :

- **user_profile** : Informations de base sur l'utilisateur
- **user_skills** : Compétences de l'utilisateur
- **user_experiences** : Expériences professionnelles de l'utilisateur
- **user_education** : Formation de l'utilisateur
- **user_languages** : Langues maîtrisées par l'utilisateur
- **companies** : Entreprises qui recrutent
- **jobs** : Offres d'emploi scrapées
- **job_skills** : Compétences requises pour chaque offre
- **transport_data** : Données de transport entre le domicile et le lieu de travail
- **applications** : Candidatures envoyées ou à envoyer
- **kanban_columns** : Colonnes du tableau Kanban
- **kanban_cards** : Cartes du tableau Kanban

## Modules principaux

### Module de parsing de CV (cv_parser.py)

Ce module utilise pdfminer.six et spaCy pour extraire les informations structurées des CV au format PDF. Il identifie les sections du CV (expérience, formation, compétences) et extrait les entités nommées pertinentes.

### Module de scraping d'offres d'emploi (job_scraper.py)

Ce module utilise JobSpy pour scraper les offres d'emploi de différentes plateformes (LinkedIn, Indeed, etc.). Il filtre les offres selon les critères définis par l'utilisateur et les stocke dans la base de données.

### Module de scraping Google Maps (transport_scraper.py)

Ce module utilise Selenium pour scraper les temps de transport entre le domicile de l'utilisateur et le lieu de travail des offres d'emploi. Il prend en compte les transports en commun (métro, bus, train, tram).

### Module de matching et scoring (matching_engine.py)

Ce module calcule un score de matching entre le profil de l'utilisateur et les offres d'emploi en utilisant des embeddings et un LLM local via Ollama. Il prend en compte les compétences, l'expérience et d'autres critères.

### Module de génération de contenu (content_generator.py)

Ce module génère des CV et lettres de motivation personnalisés pour chaque offre d'emploi en utilisant un LLM local via Ollama. Il utilise des templates prédéfinis et les adapte en fonction du profil de l'utilisateur et de l'offre.

### Module d'intégration NocoDB (nocodb_integration.py)

Ce module synchronise les données entre la base de données SQLite et l'instance NocoDB pour permettre la gestion des candidatures via une interface Kanban.

## Installation et configuration

### Prérequis

- Python 3.10 ou supérieur
- Docker et Docker Compose
- Ollama (installé et configuré)
- NocoDB (installé via Docker)
- Chrome ou Chromium (pour le scraping avec Selenium)

### Installation des dépendances Python

```bash
# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### Configuration de la base de données

```bash
# Initialiser la base de données
python setup_database.py
```

### Configuration d'Ollama

Assurez-vous qu'Ollama est installé et que le modèle llama3:8b est disponible :

```bash
# Installer le modèle llama3:8b
ollama pull llama3:8b
```

### Configuration de NocoDB

Assurez-vous que NocoDB est en cours d'exécution via Docker :

```bash
# Vérifier que NocoDB est en cours d'exécution
docker ps | grep nocodb

# Si nécessaire, démarrer NocoDB
docker-compose up -d nocodb
```

### Configuration de l'application

Créez un fichier `.env` à la racine du projet avec les informations suivantes :

```
# Chemin vers la base de données
DB_PATH=/chemin/vers/jobs.db

# Informations sur le domicile
HOME_LOCATION=Votre adresse complète

# Configuration d'Ollama
OLLAMA_URL=http://localhost:11434

# Configuration de NocoDB
NOCODB_URL=http://localhost:8080
NOCODB_AUTH_TOKEN=votre_token_auth
```

## Utilisation

### Importer un CV

```bash
# Importer un CV au format PDF
python import_cv.py --file /chemin/vers/votre_cv.pdf
```

### Scraper les offres d'emploi

```bash
# Scraper les offres d'emploi
python scrape_jobs.py --keywords "développeur python" --location "Paris" --limit 50
```

### Calculer les temps de transport

```bash
# Calculer les temps de transport pour toutes les offres
python calculate_transport.py --home "Votre adresse complète"
```

### Calculer les scores de matching

```bash
# Calculer les scores de matching pour toutes les offres
python calculate_matching.py
```

### Générer des CV et lettres de motivation

```bash
# Générer des documents pour une offre spécifique
python generate_documents.py --job-id 123
```

### Synchroniser avec NocoDB

```bash
# Synchroniser toutes les offres avec NocoDB
python sync_nocodb.py --sync-all
```

### Interface utilisateur

Une interface utilisateur simple est disponible pour interagir avec l'application :

```bash
# Lancer l'interface utilisateur
python app.py
```

L'interface sera accessible à l'adresse http://localhost:5000

## Personnalisation

### Templates de prompts

Les templates pour la génération de CV et lettres de motivation se trouvent dans le répertoire `templates/` :

- `cv_prompt.txt` : Template pour la génération de CV
- `cover_letter_prompt.txt` : Template pour la génération de lettres de motivation

Vous pouvez modifier ces templates selon vos besoins en respectant les variables entre accolades (par exemple, `{{job_title}}`).

### Modèle LLM

Par défaut, l'application utilise le modèle llama3:8b via Ollama. Vous pouvez modifier le modèle utilisé en éditant le fichier `.env` :

```
OLLAMA_MODEL=llama3:8b  # Remplacez par un autre modèle si nécessaire
```

### Critères de filtrage

Vous pouvez personnaliser les critères de filtrage des offres d'emploi en modifiant les paramètres dans les scripts correspondants ou via l'interface utilisateur.

## Dépannage

### Problèmes courants

#### Erreur de connexion à Ollama

Vérifiez qu'Ollama est en cours d'exécution :

```bash
# Vérifier le statut d'Ollama
ps aux | grep ollama
```

#### Erreur de scraping avec Selenium

Vérifiez que Chrome ou Chromium est installé et que le chromedriver est compatible :

```bash
# Installer Chrome
sudo apt update
sudo apt install chromium-browser

# Vérifier la version de Chrome
chromium-browser --version
```

#### Erreur de connexion à NocoDB

Vérifiez que NocoDB est en cours d'exécution et que le token d'authentification est correct :

```bash
# Vérifier le statut de NocoDB
docker ps | grep nocodb

# Redémarrer NocoDB si nécessaire
docker-compose restart nocodb
```

### Journaux

Les journaux de l'application se trouvent dans le répertoire `logs/` :

```bash
# Afficher les dernières lignes des journaux
tail -f logs/app.log
```

## Support et contribution

Pour toute question ou suggestion, veuillez ouvrir une issue sur le dépôt GitHub du projet.

---

© 2025 - Application d'Automatisation de Recherche d'Emploi
