# Documentation complète de l'application d'automatisation de recherche d'emploi

## Table des matières

1. [Introduction](#introduction)
2. [État actuel du projet](#état-actuel-du-projet)
3. [Architecture générale](#architecture-générale)
4. [Installation et configuration](#installation-et-configuration)
5. [Modules principaux](#modules-principaux)
6. [Interface graphique](#interface-graphique)
7. [Utilisation de l'application](#utilisation-de-lapplication)
8. [Personnalisation](#personnalisation)
9. [Dépannage](#dépannage)
10. [Développement et extension](#développement-et-extension)
11. [Références](#références)

## Introduction

L'application d'automatisation de recherche d'emploi est une solution complète et locale conçue pour optimiser votre processus de recherche d'emploi. Elle automatise les tâches chronophages et vous aide à vous concentrer sur les opportunités les plus pertinentes.

### Fonctionnalités principales

- **Scraping d'offres d'emploi** : Collecte automatique d'offres depuis diverses plateformes
- **Analyse de CV** : Extraction intelligente des informations de votre CV
- **Calcul des temps de trajet** : Évaluation des temps de trajet depuis plusieurs domiciles
- **Scoring et matching** : Évaluation de la pertinence des offres par rapport à votre profil
- **Détection des doublons** : Identification et gestion des offres similaires
- **Génération de contenu** : Création automatique de CV et lettres de motivation personnalisés
- **Gestion Kanban** : Suivi visuel de vos candidatures avec intégration NocoDB
- **Interface graphique moderne** : Application de bureau réactive et intuitive avec Tauri
- **Suggestions IA** : Recommandations personnalisées basées sur votre profil
- **Analyse de feedback** : Optimisation continue basée sur vos décisions

### Avantages

- **Entièrement local** : Toutes les données restent sur votre ordinateur
- **Personnalisable** : Adaptez l'application à vos besoins spécifiques
- **Multimodale** : Prise en compte de différents modes de transport
- **Intelligence artificielle** : Utilisation de LLM locaux ou distants pour l'analyse et la génération
- **Open source** : Code source disponible et modifiable
- **Performant** : Interface légère et réactive grâce à Tauri
- **Sécurisé** : Protection des données personnelles avec sandboxing

## État actuel du projet

Le projet dispose d'une base de code fonctionnelle avec les composants suivants :

### Modules Python implémentés
- `cv_parser.py` : Analyse de CV
- `job_scraper.py` : Scraping d'offres d'emploi
- `transport_scraper.py` : Calcul des temps de trajet
- `matching_engine.py` : Évaluation des offres
- `content_generator.py` : Génération de documents
- `nocodb_integration.py` : Intégration avec NocoDB

### Modules à implémenter
- `duplicate_detector.py` : Détection des offres similaires
- `location_manager.py` : Gestion des domiciles multiples
- `search_preferences.py` : Gestion des préférences de recherche
- `ai_suggestions.py` : Suggestions basées sur le CV
- `kanban_feedback.py` : Analyse du feedback Kanban
- `llm_api_manager.py` : Gestion des API LLM

### Infrastructure configurée
- Base de données SQLite fonctionnelle
- Docker avec NocoDB et Ollama
- Environnement de développement Python 3.10+
- Interface Tauri en cours de développement

### Interface en cours de développement
- Développement avec Tauri et React/TypeScript
- Structure de base React/TypeScript
- Intégration NocoDB en cours
- Composants modernes avec Tailwind CSS

## Plan de développement

### Phase 1: Migration et Documentation (2 semaines)
- Mise à jour de la documentation existante
- Migration du code existant vers Tauri
- Tests de compatibilité

### Phase 2: Implémentation des modules manquants (3 semaines)
1. **Semaine 1: Modules de base**
   - Implémentation de `duplicate_detector.py`
   - Implémentation de `location_manager.py`
   - Tests unitaires et intégration

2. **Semaine 2: Modules d'analyse**
   - Implémentation de `search_preferences.py`
   - Implémentation de `ai_suggestions.py`
   - Tests unitaires et intégration

3. **Semaine 3: Modules avancés**
   - Implémentation de `kanban_feedback.py`
   - Implémentation de `llm_api_manager.py`
   - Tests unitaires et intégration

### Phase 3: Optimisation (2 semaines)
- Amélioration des performances
- Refonte des modules critiques
- Tests de performance

### Phase 4: Interface (2 semaines)
- Développement de l'UI avec Tauri
- Intégration des modules migrés
- Tests utilisateurs

### Phase 5: Finalisation (1 semaine)
- Tests finaux
- Documentation finale
- Préparation au déploiement

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
- **Rust 1.70+** : Pour la compilation de Tauri

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
   npm install
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
- Détection des doublons

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

### Calcul des temps de trajet (`transport_scraper.py`)

Ce module calcule les temps de trajet entre vos domiciles et les lieux de travail.

**Fonctionnalités** :
- Support de plusieurs domiciles
- Calcul multimodal (voiture, transports en commun, vélo)
- Scraping de Google Maps pour des données précises
- Estimation des distances et durées
- Prise en compte des heures de pointe
- Visualisation des trajets

**Utilisation** :
```python
from modules.transport_scraper import TransportScraper

scraper = TransportScraper()
commute_times = scraper.calculate_commute_times(
    job_location="4 Place Jussieu, 75005 Paris",
    primary_home="20 Avenue de la République, 75011 Paris",
    secondary_home="15 Rue de la Paix, 78000 Versailles"
)
```

### Évaluation des offres (`matching_engine.py`)

Ce module évalue la pertinence des offres par rapport à votre profil.

**Fonctionnalités** :
- Analyse sémantique avec embeddings
- Comparaison des compétences requises
- Prise en compte de l'expérience
- Analyse des mots-clés
- Scoring global de 0 à 1
- Détection des doublons

**Utilisation** :
```python
from modules.matching_engine import MatchingEngine

engine = MatchingEngine()
score = engine.calculate_matching_score(job_id=42)
print(f"Score de correspondance: {score * 100}%")
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
- **Gestion des doublons** : Interface de gestion des offres similaires
- **Suggestions IA** : Visualisation des recommandations

### Composants principaux

- **Navigation** : Barre de navigation latérale
- **JobCard** : Affichage compact des informations d'une offre
- **SearchForm** : Formulaire de recherche avec suggestions
- **KanbanBoard** : Tableau Kanban interactif
- **DocumentEditor** : Éditeur de documents générés
- **CommuteMap** : Carte interactive des temps de trajet
- **DuplicateManager** : Interface de gestion des doublons
- **SuggestionPanel** : Affichage des suggestions IA

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
6. Consultez les suggestions IA pour affiner votre recherche

### Gestion des candidatures

1. Depuis la liste des offres, ajoutez une offre au Kanban
2. Déplacez les cartes entre les colonnes selon l'avancement
3. Ajoutez des notes et des rappels
4. Générez des documents personnalisés pour chaque offre
5. Suivez l'historique des interactions
6. Consultez l'analyse du feedback pour améliorer vos recherches

### Génération de documents

1. Sélectionnez une offre d'emploi
2. Choisissez le type de document à générer
3. Personnalisez les options selon vos besoins
4. Prévisualisez le document généré
5. Exportez ou modifiez le document final
6. Choisissez le format de sortie (PDF, DOCX, TXT)

### Analyse des temps de trajet

1. Accédez à l'onglet "Trajets"
2. Visualisez les offres sur la carte
3. Comparez les temps de trajet depuis vos différents domiciles
4. Filtrez les offres selon le temps de trajet maximum
5. Explorez les différentes options de transport
6. Consultez les visualisations des trajets

### Gestion des doublons

1. Accédez à l'onglet "Doublons"
2. Consultez les offres identifiées comme similaires
3. Choisissez l'offre à conserver
4. Fusionnez les informations complémentaires
5. Supprimez les doublons non pertinents
6. Configurez les paramètres de détection

## Personnalisation

### Templates de prompts

Les templates pour la génération de documents se trouvent dans le dossier `templates/` :

- `cv_prompt.txt` : Template pour la génération de CV
- `cover_letter_prompt.txt` : Template pour les lettres de motivation

Vous pouvez les modifier pour adapter le style et le contenu des documents générés.

### Préférences de recherche

Vous pouvez personnaliser vos préférences de recherche via l'interface ou en modifiant directement le fichier de configuration :

```json
{
  "keywords": {
    "required": ["python", "développeur"],
    "preferred": ["django", "fastapi"],
    "excluded": ["junior", "stage"]
  },
  "location": {
    "primary": "Paris",
    "radius": 30,
    "remote": true
  },
  "salary": {
    "min": 50000,
    "currency": "EUR"
  },
  "job_types": ["CDI", "CDD"],
  "experience_level": "senior",
  "transport_preferences": {
    "max_time": 60,
    "modes": ["public_transport", "car"],
    "avoid_tolls": true
  }
}
```

## Dépannage

### Problèmes courants

1. **Scraping bloqué**
   - Vérifiez votre connexion Internet
   - Essayez de changer de proxy
   - Réduisez la fréquence des requêtes

2. **Erreurs de génération**
   - Vérifiez que Ollama est en cours d'exécution
   - Assurez-vous d'avoir assez de RAM
   - Essayez un modèle plus léger

3. **Problèmes de synchronisation NocoDB**
   - Vérifiez la connexion à la base de données
   - Regénérez le token d'API
   - Vérifiez les permissions

4. **Problèmes d'interface Tauri**
   - Vérifiez que Rust est correctement installé
   - Mettez à jour les dépendances Node.js
   - Reconstruisez l'application

### Logs et débogage

Les logs sont stockés dans le dossier `logs/` :
- `app.log` : Logs principaux de l'application
- `scraping.log` : Logs spécifiques au scraping
- `generation.log` : Logs de génération de documents
- `tauri.log` : Logs de l'interface Tauri

Pour activer le mode debug :
```bash
export LOG_LEVEL=DEBUG
python app.py
```

## Développement et extension

### Structure du code

Le code est organisé en modules indépendants qui peuvent être étendus ou remplacés :

```
modules/
├── base/           # Classes de base et interfaces
├── scraping/       # Modules de scraping
├── analysis/       # Modules d'analyse
├── generation/     # Modules de génération
└── integration/    # Modules d'intégration
```

### Ajout de nouvelles fonctionnalités

1. Créez un nouveau module dans le dossier approprié
2. Implémentez l'interface correspondante
3. Ajoutez les tests unitaires
4. Documentez le module
5. Mettez à jour la configuration

### Tests et qualité

- Tests unitaires avec pytest
- Tests d'intégration avec Docker
- Analyse statique avec pylint
- Formatage avec black
- Documentation avec sphinx
- Tests Rust avec cargo test
- Tests frontend avec Jest

## Références

### Documentation technique

- [Tauri Documentation](https://tauri.app/docs)
- [React Documentation](https://reactjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org)
- [NocoDB Documentation](https://docs.nocodb.com)

### Ressources utiles

- [JobSpy Documentation](https://github.com/taharbelarbi/jobspy)
- [Ollama Documentation](https://ollama.ai/docs)
- [spaCy Documentation](https://spacy.io/docs)
- [Sentence Transformers](https://www.sbert.net)
- [Google Maps API](https://developers.google.com/maps)