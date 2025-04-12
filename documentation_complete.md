# Documentation complète de l'application d'automatisation de recherche d'emploi

## Table des matières

1. [Introduction](#introduction)
2. [Architecture générale](#architecture-générale)
3. [Installation et configuration](#installation-et-configuration)
4. [Modules principaux](#modules-principaux)
5. [Interface graphique](#interface-graphique)
6. [Utilisation de l'application](#utilisation-de-lapplication)
7. [Personnalisation](#personnalisation)
8. [Dépannage](#dépannage)
9. [Développement et extension](#développement-et-extension)
10. [Références](#références)

## Introduction

L'application d'automatisation de recherche d'emploi est une solution complète et locale conçue pour optimiser votre processus de recherche d'emploi. Elle automatise les tâches chronophages et vous aide à vous concentrer sur les opportunités les plus pertinentes.

### Fonctionnalités principales

- **Scraping d'offres d'emploi** : Collecte automatique d'offres depuis diverses plateformes
- **Analyse de CV** : Extraction intelligente des informations de votre CV
- **Calcul des temps de trajet** : Évaluation des temps de trajet depuis deux domiciles différents
- **Scoring et matching** : Évaluation de la pertinence des offres par rapport à votre profil
- **Détection des doublons** : Identification et gestion des offres similaires
- **Génération de contenu** : Création automatique de CV et lettres de motivation personnalisés
- **Gestion Kanban** : Suivi visuel de vos candidatures avec intégration NocoDB
- **Interface graphique moderne** : Application de bureau réactive et intuitive

### Avantages

- **Entièrement local** : Toutes les données restent sur votre ordinateur
- **Personnalisable** : Adaptez l'application à vos besoins spécifiques
- **Multimodale** : Prise en compte de différents modes de transport
- **Intelligence artificielle** : Utilisation de LLM locaux ou distants pour l'analyse et la génération
- **Open source** : Code source disponible et modifiable

## Architecture générale

L'application est structurée selon une architecture modulaire qui sépare clairement les différentes fonctionnalités :

```
/app/
├── modules/                # Modules Python principaux
│   ├── cv_parser.py        # Analyse de CV
│   ├── job_scraper.py      # Scraping d'offres d'emploi
│   ├── transport_scraper.py # Calcul des temps de trajet
│   ├── matching_engine.py  # Évaluation des offres
│   ├── content_generator.py # Génération de documents
│   ├── nocodb_integration.py # Intégration avec NocoDB
│   ├── duplicate_detector.py # Détection des doublons
│   ├── location_manager.py # Gestion des domiciles multiples
│   ├── search_preferences.py # Gestion des préférences de recherche
│   ├── ai_suggestions.py   # Suggestions basées sur le CV
│   ├── kanban_feedback.py  # Analyse du feedback Kanban
│   └── llm_api_manager.py  # Gestion des API LLM
├── app.py                  # Point d'entrée principal
├── setup_database.py       # Initialisation de la base de données
├── setup_docker.sh         # Configuration Docker
├── docker-compose.yml      # Configuration des services Docker
├── templates/              # Templates pour les prompts
│   ├── cv_prompt.txt       # Template pour la génération de CV
│   └── cover_letter_prompt.txt # Template pour les lettres de motivation
└── app-tauri/              # Interface graphique Tauri
    ├── src-tauri/          # Code Rust pour Tauri
    └── src/                # Code React/TypeScript pour l'interface
```

### Flux de données

1. **Collecte** : Les offres d'emploi sont scrapées depuis différentes sources
2. **Analyse** : Les offres sont analysées et comparées à votre CV
3. **Évaluation** : Un score de correspondance est calculé pour chaque offre
4. **Enrichissement** : Les temps de trajet sont calculés depuis vos domiciles
5. **Présentation** : Les offres sont affichées dans l'interface avec toutes les informations
6. **Suivi** : Les candidatures sont gérées via le tableau Kanban
7. **Génération** : Des documents personnalisés sont créés pour les candidatures
8. **Feedback** : L'analyse du feedback Kanban améliore les futures recherches

## Installation et configuration

### Prérequis

- **Système d'exploitation** : Windows, macOS ou Linux
- **Docker** : Pour NocoDB et Ollama
- **Python 3.10+** : Pour les modules principaux
- **Node.js 20+** : Pour l'interface Tauri
- **Rust** : Pour la compilation de Tauri

### Installation

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/votre-nom/job-search-assistant.git
   cd job-search-assistant
   ```

2. **Installer les dépendances Python** :
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer Docker** :
   ```bash
   chmod +x setup_docker.sh
   ./setup_docker.sh
   ```

4. **Initialiser la base de données** :
   ```bash
   python setup_database.py
   ```

5. **Configurer l'environnement** :
   Créez un fichier `.env` à la racine du projet avec les informations suivantes :
   ```
   DB_PATH=/chemin/absolu/vers/jobs.db
   PRIMARY_HOME=Votre adresse principale complète
   SECONDARY_HOME=Votre adresse secondaire complète
   OLLAMA_URL=http://localhost:11434
   NOCODB_URL=http://localhost:8080
   NOCODB_AUTH_TOKEN=votre_token_auth
   ```

6. **Construire l'interface graphique** :
   ```bash
   chmod +x init_tauri_project.sh
   ./init_tauri_project.sh
   cd app-tauri
   npm run tauri build
   ```

### Configuration de NocoDB

1. Accédez à NocoDB via `http://localhost:8080`
2. Créez un compte administrateur
3. Créez un nouveau projet
4. Générez un token d'API dans les paramètres
5. Ajoutez ce token dans votre fichier `.env`

### Configuration d'Ollama

1. Vérifiez qu'Ollama est en cours d'exécution : `http://localhost:11434`
2. Téléchargez les modèles nécessaires :
   ```bash
   ollama pull llama3:8b
   ollama pull mistral:7b
   ```

## Modules principaux

### Analyse de CV (`cv_parser.py`)

Ce module extrait les informations pertinentes de votre CV au format PDF.

**Fonctionnalités** :
- Extraction du texte avec pdfminer.six
- Analyse des compétences avec spaCy
- Identification des expériences professionnelles
- Détection des formations et diplômes
- Extraction des informations de contact

**Utilisation** :
```python
from modules.cv_parser import CVParser

parser = CVParser()
cv_data = parser.parse_cv("/chemin/vers/votre_cv.pdf")
print(cv_data["skills"])  # Liste des compétences
```

### Scraping d'offres d'emploi (`job_scraper.py`)

Ce module collecte les offres d'emploi depuis diverses plateformes en utilisant JobSpy.

**Fonctionnalités** :
- Support de multiples sites d'emploi
- Filtrage par mots-clés, localisation, date
- Extraction des informations salariales
- Détection de la langue de l'offre
- Normalisation des données

**Utilisation** :
```python
from modules.job_scraper import JobScraper

scraper = JobScraper()
jobs = scraper.search_jobs(
    keywords=["développeur", "python"],
    location="Paris",
    radius=30,
    job_type=["CDI", "CDD"],
    date_posted="week"
)
```

### Calcul des temps de trajet (`transport_scraper_v2.py`)

Ce module calcule les temps de trajet entre vos domiciles et les lieux de travail.

**Fonctionnalités** :
- Support de deux domiciles (principal et secondaire)
- Calcul multimodal (voiture, transports en commun, vélo)
- Scraping de Google Maps pour des données précises
- Estimation des distances et durées
- Prise en compte des heures de pointe

**Utilisation** :
```python
from modules.transport_scraper_v2 import TransportScraper

scraper = TransportScraper()
commute_times = scraper.calculate_commute_times(
    job_location="4 Place Jussieu, 75005 Paris",
    primary_home="20 Avenue de la République, 75011 Paris",
    secondary_home="15 Rue de la Paix, 78000 Versailles"
)
```

### Gestion des domiciles multiples (`location_manager.py`)

Ce module gère les différentes adresses de domicile et leurs paramètres.

**Fonctionnalités** :
- Stockage de deux adresses de domicile
- Géocodage des adresses
- Validation des adresses
- Préférences de transport par domicile
- Calcul des zones accessibles

**Utilisation** :
```python
from modules.location_manager import LocationManager

manager = LocationManager()
manager.set_primary_home("20 Avenue de la République, 75011 Paris")
manager.set_secondary_home("15 Rue de la Paix, 78000 Versailles")
manager.set_transport_preference("primary", "public_transport")
```

### Évaluation des offres (`matching_engine.py`)

Ce module évalue la pertinence des offres par rapport à votre profil.

**Fonctionnalités** :
- Analyse sémantique avec embeddings
- Comparaison des compétences requises
- Prise en compte de l'expérience
- Analyse des mots-clés
- Scoring global de 0 à 1

**Utilisation** :
```python
from modules.matching_engine import MatchingEngine

engine = MatchingEngine()
score = engine.calculate_matching_score(job_id=42)
print(f"Score de correspondance: {score * 100}%")
```

### Détection des doublons (`duplicate_detector.py`)

Ce module identifie et gère les offres similaires ou identiques.

**Fonctionnalités** :
- Détection par URL
- Analyse de similarité textuelle
- Fusion des informations complémentaires
- Historique des doublons
- Statistiques sur les sources

**Utilisation** :
```python
from modules.duplicate_detector import DuplicateDetector

detector = DuplicateDetector()
duplicates = detector.find_duplicates(job_id=42)
if duplicates:
    detector.merge_jobs(job_id=42, duplicate_ids=duplicates)
```

### Préférences de recherche (`search_preferences.py`)

Ce module gère vos préférences de recherche et les pondérations des mots-clés.

**Fonctionnalités** :
- Catégories de mots-clés
- Pondération personnalisable
- Ensembles de préférences multiples
- Suggestions basées sur le CV
- Historique des recherches

**Utilisation** :
```python
from modules.search_preferences import SearchPreferences

prefs = SearchPreferences()
prefs.add_keyword("python", category="skills", weight=0.9)
prefs.add_keyword("remote", category="conditions", weight=0.7)
criteria = prefs.generate_search_criteria()
```

### Suggestions IA (`ai_suggestions.py`)

Ce module génère des suggestions de recherche basées sur votre CV.

**Fonctionnalités** :
- Analyse du CV avec LLM
- Suggestions de mots-clés pertinents
- Identification des postes adaptés
- Recommandations d'entreprises
- Optimisation des critères de recherche

**Utilisation** :
```python
from modules.ai_suggestions import AISuggestions

ai = AISuggestions()
suggestions = ai.generate_suggestions_from_cv()
for category, keywords in suggestions.items():
    print(f"{category}: {', '.join(keywords)}")
```

### Analyse du feedback Kanban (`kanban_feedback.py`)

Ce module analyse votre utilisation du Kanban pour améliorer les recherches futures.

**Fonctionnalités** :
- Analyse des offres acceptées/refusées
- Extraction de patterns
- Ajustement automatique des pondérations
- Optimisation des mots-clés
- Amélioration continue du scoring

**Utilisation** :
```python
from modules.kanban_feedback import KanbanFeedbackAnalyzer

analyzer = KanbanFeedbackAnalyzer()
feedback = analyzer.analyze_kanban_feedback()
analyzer.update_search_preferences()
```

### Gestion des API LLM (`llm_api_manager.py`)

Ce module gère différentes API LLM (locales et distantes) et choisit automatiquement la plus appropriée.

**Fonctionnalités** :
- Support d'Ollama local
- Intégration d'API alternatives (OpenAI, Mistral, etc.)
- Gestion des coûts et quotas
- Basculement automatique
- Suivi de l'utilisation

**Utilisation** :
```python
from modules.llm_api_manager import LLMApiManager

manager = LLMApiManager()
provider = manager.get_best_provider(operation_type="document_generation")
model = manager.get_best_model(provider["id"], model_type="chat")
```

### Génération de contenu (`content_generator.py`)

Ce module génère des documents personnalisés pour vos candidatures.

**Fonctionnalités** :
- Génération de CV adaptés
- Création de lettres de motivation
- Personnalisation selon l'offre
- Utilisation de templates
- Support de formats multiples (TXT, DOCX, PDF)

**Utilisation** :
```python
from modules.content_generator import ContentGenerator

generator = ContentGenerator()
cover_letter = generator.generate_cover_letter(job_id=42)
with open("lettre_motivation.txt", "w") as f:
    f.write(cover_letter)
```

### Intégration NocoDB (`nocodb_integration.py`)

Ce module synchronise les données avec votre instance NocoDB pour la gestion Kanban.

**Fonctionnalités** :
- Synchronisation bidirectionnelle
- Gestion des colonnes Kanban
- Suivi des modifications
- Gestion des pièces jointes
- Support des commentaires

**Utilisation** :
```python
from modules.nocodb_integration import NocoDBIntegration

noco = NocoDBIntegration()
noco.sync_jobs_to_nocodb()
noco.sync_kanban_from_nocodb()
```

## Interface graphique

L'interface graphique est développée avec Tauri, React et TypeScript, offrant une expérience utilisateur moderne et réactive.

### Structure de l'interface

- **Tableau de bord** : Vue d'ensemble avec statistiques et activité récente
- **Recherche d'offres** : Formulaire de recherche et liste des résultats
- **Kanban** : Tableau de suivi des candidatures
- **Profil** : Gestion du profil utilisateur et des préférences
- **Générateur de documents** : Création de CV et lettres de motivation
- **Analyse des trajets** : Visualisation des temps de trajet

### Composants principaux

- **Navigation** : Barre de navigation latérale
- **JobCard** : Affichage compact des informations d'une offre
- **SearchForm** : Formulaire de recherche avec suggestions
- **KanbanBoard** : Tableau Kanban interactif
- **DocumentEditor** : Éditeur de documents générés
- **CommuteMap** : Carte interactive des temps de trajet

### Fonctionnalités d'accessibilité

- Support complet du clavier
- Compatibilité avec les lecteurs d'écran
- Thèmes clair et sombre
- Options de taille de texte ajustable
- Contraste élevé pour une meilleure lisibilité

### Responsive design

L'interface s'adapte à différentes tailles d'écran :
- **Desktop** : Utilisation optimale de l'espace
- **Tablette** : Réorganisation des éléments
- **Mobile** : Interface simplifiée

## Utilisation de l'application

### Premier démarrage

1. Lancez l'application via l'exécutable ou la commande :
   ```bash
   cd app-tauri
   npm run tauri dev
   ```

2. À la première exécution, vous serez invité à configurer :
   - Vos informations personnelles
   - Vos adresses de domicile
   - L'importation de votre CV
   - Les préférences de recherche initiales

3. L'application générera automatiquement des suggestions basées sur votre CV

### Recherche d'offres d'emploi

1. Accédez à l'onglet "Recherche"
2. Remplissez le formulaire avec vos critères ou utilisez les suggestions
3. Lancez la recherche
4. Parcourez les résultats triés par score de correspondance
5. Utilisez les filtres pour affiner les résultats

### Gestion des candidatures

1. Depuis la liste des offres, ajoutez une offre au Kanban
2. Déplacez les cartes entre les colonnes selon l'avancement
3. Ajoutez des notes et des rappels
4. Générez des documents personnalisés pour chaque offre
5. Suivez l'historique des interactions

### Génération de documents

1. Sélectionnez une offre d'emploi
2. Choisissez le type de document à générer
3. Personnalisez les options selon vos besoins
4. Prévisualisez le document généré
5. Exportez ou modifiez le document final

### Analyse des temps de trajet

1. Accédez à l'onglet "Trajets"
2. Visualisez les offres sur la carte
3. Comparez les temps de trajet depuis vos deux domiciles
4. Filtrez les offres selon le temps de trajet maximum
5. Explorez les différentes options de transport

## Personnalisation

### Templates de prompts

Les templates pour la génération de documents se trouvent dans le dossier `templates/` :

- `cv_prompt.txt` : Template pour la génération de CV
- `cover_letter_prompt.txt` : Template pour les lettres de motivation

Vous pouvez les modifier pour adapter le style et le contenu des documents générés.

### Préférences de
(Content truncated due to size limit. Use line ranges to read in chunks)