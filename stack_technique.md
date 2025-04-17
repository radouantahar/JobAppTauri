# Stack Technique - Application d'Automatisation de Recherche d'Emploi

Ce document détaille les technologies, bibliothèques et outils spécifiques qui seront utilisés pour chaque composant de l'architecture de l'application.

## 1. Interface Utilisateur

### Framework Principal
- **Tauri** - Framework moderne pour applications desktop multi-plateformes
  - Version: 1.5+
  - Backend en Rust pour les fonctionnalités système
  - Avantages: Léger, performant, sécurisé, utilise les WebViews natives
  - **tauri-plugin-store** - Pour la persistance des paramètres
  - **tauri-plugin-notification** - Pour les notifications système
  - **tauri-plugin-window-state** - Pour la gestion de l'état des fenêtres
  - **tauri-plugin-sql** - Pour l'accès à SQLite
  - **tauri-plugin-fs** - Pour la gestion des fichiers
  - **tauri-plugin-http** - Pour les requêtes HTTP
  - **tauri-plugin-autostart** - Pour le démarrage automatique

### Frontend
- **React.js** avec **TypeScript** - Pour une interface utilisateur robuste et typée
  - Version: React 18+, TypeScript 5+
  - **React Router** - Pour la navigation
  - **React Query** - Pour la gestion des requêtes et du cache
  - **Zustand** - Pour la gestion d'état globale
  - **Tailwind CSS** - Pour le design responsive
  - **Headless UI** - Pour les composants accessibles
  - **React DnD** - Pour les fonctionnalités de drag-and-drop du Kanban
  - **React Hook Form** - Pour la gestion des formulaires
  - **React Icons** - Pour les icônes
  - **React Hot Toast** - Pour les notifications
  - **React Virtualized** - Pour le rendu efficace des listes
  - **React Window** - Pour le rendu des grandes listes
  - **React Beautiful DnD** - Pour le drag-and-drop avancé
  - **React Error Boundary** - Pour la gestion des erreurs
  - **React Suspense** - Pour le chargement différé
  - **React Query Devtools** - Pour le débogage

### Interface Kanban
- **NocoDB** (déjà installé en Docker) - Pour la gestion des données en mode Kanban
  - Configuration via l'API REST de NocoDB pour l'intégration avec l'application
  - **@nocodb/sdk** - Pour l'intégration avec l'API NocoDB
  - **@nocodb/ui** - Pour les composants d'interface
  - **@nocodb/plugin-kanban** - Pour les fonctionnalités Kanban
  - **@nocodb/plugin-calendar** - Pour la vue calendrier
  - **@nocodb/plugin-gallery** - Pour la vue galerie

## 2. Backend et Stockage de Données

### Base de Données
- **SQLite** - Base de données locale légère
  - **sqlx** - ORM Rust pour interagir avec la base de données
    - Version: 0.7+
    - Features: runtime-tokio-rustls, sqlite, chrono, uuid
    - Avantages: 
      - Vérification des requêtes SQL au moment de la compilation
      - Support asynchrone avec tokio
      - Gestion des migrations
      - Support des types chrono et uuid
  - **rusqlite** - Pour l'accès bas niveau à SQLite
    - Version: 0.29.0+
    - Features: bundled
    - Utilisé pour les opérations spécifiques nécessitant un accès direct
  - **Pydantic** - Pour la validation des données côté Python
  - **sqlite-vss** - Pour la recherche vectorielle
  - **sqlite-fts5** - Pour la recherche en texte intégral
  - **sqlite-utils** - Pour les utilitaires SQLite
  - **sqlite-web** - Pour l'interface web SQLite

### Serveur Local
- **FastAPI** - Framework Python pour créer une API REST locale
  - Version: 0.100+
  - **Uvicorn** - Serveur ASGI pour FastAPI
  - **pydantic-settings** - Pour la gestion des configurations
  - **python-multipart** - Pour le traitement des fichiers
  - **python-jose** - Pour l'authentification JWT
  - **passlib** - Pour le hachage des mots de passe
  - **python-jose[cryptography]** - Pour le chiffrement
  - **python-jose[pycryptodome]** - Pour les algorithmes de chiffrement
  - **httpx** - Pour les requêtes HTTP asynchrones
  - **tenacity** - Pour les retries automatiques

## 3. Module de Scraping

### Scraping d'Offres d'Emploi
- **JobSpy** (python-jobspy) - Bibliothèque principale pour le scraping des sites d'emploi
  - Version: 1.1.79
  - Supporte LinkedIn, Indeed, Glassdoor, Google Jobs, ZipRecruiter, etc.
  - **aiohttp** - Pour les requêtes HTTP asynchrones
  - **beautifulsoup4** - Pour le parsing HTML
  - **lxml** - Pour le parsing XML/HTML rapide
  - **selectolax** - Pour le parsing HTML optimisé
  - **parsel** - Pour l'extraction de données
  - **w3lib** - Pour le nettoyage des URLs
  - **retry** - Pour les retries automatiques
  - **backoff** - Pour le backoff exponentiel

### Scraping de Temps de Transport
- **Selenium** - Pour l'automatisation du navigateur
  - **webdriver-manager** - Pour la gestion automatique des pilotes
  - **undetected-chromedriver** - Pour éviter la détection
- **Playwright** (alternative) - Pour les cas où Selenium rencontrerait des limitations
  - **playwright-python** - Pour l'automatisation avec Python
  - **playwright-stealth** - Pour éviter la détection
  - **playwright-extra** - Pour les fonctionnalités avancées
  - **playwright-async-api** - Pour l'API asynchrone

### Gestion des Proxies
- **rotating-proxy-list** - Pour éviter les blocages
- **aiohttp-socks** - Pour le support des proxies SOCKS
- **proxy-database** - Pour la gestion des proxies
- **proxy-checker** - Pour la vérification des proxies
- **proxybroker** - Pour la recherche de proxies
- **proxy-rotator** - Pour la rotation des proxies

## 4. Module de Parsing et Traitement de CV

### Extraction de Texte PDF
- **PyPDF2** - Pour l'extraction basique
- **pdfminer.six** - Pour une extraction avancée
- **pdfplumber** - Pour l'extraction de tableaux
- **pdf2image** - Pour la conversion en images
- **pytesseract** - Pour l'OCR
- **pdfquery** - Pour l'extraction de données
- **pdfrw** - Pour la manipulation de PDF
- **pdfkit** - Pour la génération de PDF

### Traitement du Texte
- **spaCy** - Pour l'analyse NLP
  - Modèle français: fr_core_news_md
- **NLTK** - Pour le traitement linguistique
- **transformers** - Pour l'analyse sémantique
  - Modèle: paraphrase-multilingual-mpnet-base-v2
- **sentence-transformers** - Pour les embeddings
- **fasttext** - Pour la classification de texte
- **gensim** - Pour l'analyse de similarité
- **textblob** - Pour l'analyse de sentiment
- **pattern** - Pour l'analyse de texte

## 5. Module de Matching et Scoring

### Embeddings et Similarité Sémantique
- **Sentence-Transformers** - Pour les embeddings
- **scikit-learn** - Pour les calculs de similarité
- **numpy** - Pour les calculs numériques
- **pandas** - Pour l'analyse des données
- **faiss** - Pour la recherche vectorielle
- **annoy** - Pour les index approximatifs
- **hnswlib** - Pour les index hiérarchiques
- **nmslib** - Pour la recherche de similarité

### Intégration LLM Local
- **Ollama** (déjà installé en Docker)
  - Modèle: llama3:8b
- **LangChain** - Pour l'interaction avec Ollama
- **llama-index** - Pour l'indexation sémantique
- **llama-cpp-python** - Pour l'interface Python
- **llama-tokenizer-js** - Pour le tokenization
- **llama-api** - Pour l'API REST
- **llama-cli** - Pour l'interface en ligne de commande

## 6. Module de Génération de Documents

### Génération de Texte
- **Ollama** avec templates personnalisés
- **Jinja2** - Pour le templating
- **prompt-toolkit** - Pour la gestion des prompts
- **langchain** - Pour la génération de texte
- **transformers** - Pour la génération de texte
- **text-generation** - Pour la génération de texte
- **gpt-2-simple** - Pour la génération de texte
- **gpt-neo** - Pour la génération de texte

### Création de Documents
- **python-docx** - Pour les fichiers Word
- **docxtpl** - Pour les templates Word
- **pdfkit** - Pour la conversion en PDF
- **weasyprint** - Alternative pour la conversion en PDF
- **reportlab** - Pour la génération de PDF
- **pypdf** - Pour la manipulation de PDF
- **docx2pdf** - Pour la conversion Word vers PDF
- **pdf2docx** - Pour la conversion PDF vers Word

## 7. Modules à Implémenter

### Détection des Doublons
- **difflib** - Pour la comparaison de texte
- **fuzzywuzzy** - Pour la correspondance floue
- **rapidfuzz** - Pour les comparaisons rapides
- **textdistance** - Pour les distances de texte
- **jellyfish** - Pour les comparaisons de chaînes
- **strsim** - Pour la similarité de chaînes
- **python-Levenshtein** - Pour la distance de Levenshtein
- **textacy** - Pour l'analyse de texte

### Gestion des Domiciles
- **geopy** - Pour le géocodage
- **folium** - Pour la visualisation
- **polyline** - Pour les itinéraires
- **geojson** - Pour le stockage des données géographiques
- **shapely** - Pour les opérations géométriques
- **rtree** - Pour les index spatiaux
- **osmnx** - Pour les données OpenStreetMap
- **networkx** - Pour l'analyse de réseau

### Préférences de Recherche
- **pydantic** - Pour la validation
- **numpy** - Pour les calculs
- **pandas** - Pour l'analyse
- **scikit-learn** - Pour le machine learning
- **optuna** - Pour l'optimisation
- **hyperopt** - Pour l'optimisation hyperparamétrique
- **bayesian-optimization** - Pour l'optimisation bayésienne
- **scikit-optimize** - Pour l'optimisation séquentielle

### Suggestions IA
- **transformers** - Pour l'analyse
- **scikit-learn** - Pour les recommandations
- **numpy** - Pour les calculs
- **torch** - Pour le deep learning
- **lightgbm** - Pour le boosting
- **xgboost** - Pour le boosting
- **catboost** - Pour le boosting
- **prophet** - Pour les prévisions

### Analyse du Feedback Kanban
- **pandas** - Pour l'analyse
- **scikit-learn** - Pour les patterns
- **matplotlib** - Pour la visualisation
- **plotly** - Pour les graphiques interactifs
- **seaborn** - Pour les visualisations statistiques
- **bokeh** - Pour les visualisations interactives
- **altair** - Pour les visualisations déclaratives
- **holoviews** - Pour les visualisations complexes

### Gestion des API LLM
- **httpx** - Pour les requêtes HTTP
- **pydantic** - Pour la validation
- **tenacity** - Pour les retries
- **backoff** - Pour le backoff exponentiel
- **aiohttp** - Pour les requêtes asynchrones
- **requests** - Pour les requêtes HTTP
- **urllib3** - Pour les requêtes HTTP
- **httplib2** - Pour les requêtes HTTP

## 8. Scheduler et Automatisation

### Planification des Tâches
- **APScheduler** - Pour la planification
- **schedule** - Alternative légère
- **croniter** - Pour le parsing des expressions cron
- **celery** - Pour les tâches distribuées
- **dramatiq** - Pour les tâches asynchrones
- **rq** - Pour les tâches en file d'attente
- **huey** - Pour les tâches en file d'attente
- **arq** - Pour les tâches asynchrones

### Logging et Monitoring
- **Loguru** - Pour les logs
- **structlog** - Pour le logging structuré
- **prometheus-client** - Pour les métriques
- **sentry-sdk** - Pour le monitoring des erreurs
- **opentelemetry** - Pour le tracing distribué
- **elastic-apm** - Pour le monitoring des performances
- **newrelic** - Pour le monitoring des performances
- **datadog** - Pour le monitoring des performances

## 9. Conteneurisation et Déploiement

### Docker
- **Docker Compose** - Pour l'orchestration
- **NocoDB** - Pour l'interface Kanban
- **Ollama** - Pour le LLM local
- **Redis** (optionnel) - Pour le cache
- **PostgreSQL** (optionnel) - Pour la base de données
- **MinIO** (optionnel) - Pour le stockage d'objets
- **Traefik** - Pour le reverse proxy
- **Portainer** - Pour la gestion de Docker

### Packaging Application
- **Tauri CLI** - Pour le packaging
- **PyInstaller** - Pour le backend
- **electron-builder** (alternative) - Pour le packaging
- **nsis** - Pour les installateurs Windows
- **appimagetool** - Pour les packages Linux
- **create-dmg** - Pour les packages macOS
- **wix** - Pour les installateurs Windows
- **inno setup** - Pour les installateurs Windows

## 10. Outils de Développement

### Environnement de Développement
- **Poetry** - Pour les dépendances Python
- **Node.js** et **npm** - Pour le frontend
- **Rust** et **Cargo** - Pour Tauri
- **ESLint** et **Prettier** - Pour le linting
- **Black** et **isort** - Pour le formatage Python
- **mypy** - Pour le typage statique Python
- **clippy** - Pour le linting Rust
- **rustfmt** - Pour le formatage Rust

### Tests
- **Pytest** - Pour les tests Python
- **Jest** - Pour les tests frontend
- **Playwright Test** - Pour les tests E2E
- **cargo test** - Pour les tests Rust
- **coverage** - Pour la couverture de tests
- **mutation-testing** - Pour les tests de mutation
- **property-based-testing** - Pour les tests basés sur les propriétés
- **benchmark** - Pour les tests de performance

## Système de Préchargement

### Dépendances
- @tauri-apps/api/core
- react
- zustand (pour le store global)
- react-query (pour le cache)
- axios (pour les requêtes HTTP)
- retry (pour les retries)
- backoff (pour le backoff exponentiel)

### Configuration
```typescript
const PRELOAD_BATCH_SIZE = 10;
const PRELOAD_DELAY = 100; // ms
const MAX_RETRIES = 3;
```

### Tests
- Vitest pour les tests unitaires
- @testing-library/react pour les tests d'intégration
- Tests de performance avec performance.now()

### Métriques
- Temps de préchargement
- Utilisation mémoire
- Nombre de retries
- Taux de succès

### Bonnes Pratiques
- Chargement progressif
- Gestion des erreurs
- Nettoyage des ressources
- Tests de performance

## Compatibilité et Prérequis

### Système d'Exploitation
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Fedora 34+)

### Matériel Recommandé
- CPU: 4 cœurs minimum
- RAM: 8 Go minimum (16 Go recommandé)
- Espace disque: 10 Go minimum
- GPU: Optionnel (pour accélérer les LLM)

### Dépendances Système
- Python 3.10+
- Node.js 18+
- Rust 1.70+
- Docker et Docker Compose
- Chrome ou Firefox (pour Selenium/Playwright)

## Considérations de Performance

- Les opérations de scraping sont asynchrones
- Le LLM local peut être configuré pour utiliser moins de ressources
- Les tâches intensives sont planifiées pendant les périodes d'inactivité
- L'utilisation de Tauri permet une meilleure gestion des ressources
- La base de données SQLite est optimisée avec des index et des vues
- Le cache est utilisé pour les données fréquemment accédées
- Les requêtes HTTP sont mises en cache quand possible
- La recherche vectorielle est optimisée avec FAISS
- Le rendu de l'interface est optimisé avec React Virtualized
