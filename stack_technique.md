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

### Interface Kanban
- **NocoDB** (déjà installé en Docker) - Pour la gestion des données en mode Kanban
  - Configuration via l'API REST de NocoDB pour l'intégration avec l'application
  - **@nocodb/sdk** - Pour l'intégration avec l'API NocoDB
  - **@nocodb/ui** - Pour les composants d'interface
  - **@nocodb/plugin-kanban** - Pour les fonctionnalités Kanban

## 2. Backend et Stockage de Données

### Base de Données
- **SQLite** - Base de données locale légère
  - **SQLAlchemy** - ORM Python pour interagir avec la base de données
  - **Alembic** - Pour les migrations de schéma de base de données
  - **Pydantic** - Pour la validation des données
  - **aiosqlite** - Pour l'accès asynchrone à SQLite
  - **sqlite-vss** - Pour la recherche vectorielle
  - **sqlite-fts5** - Pour la recherche en texte intégral

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

### Scraping de Temps de Transport
- **Selenium** - Pour l'automatisation du navigateur
  - **webdriver-manager** - Pour la gestion automatique des pilotes
  - **undetected-chromedriver** - Pour éviter la détection
- **Playwright** (alternative) - Pour les cas où Selenium rencontrerait des limitations
  - **playwright-python** - Pour l'automatisation avec Python
  - **playwright-stealth** - Pour éviter la détection
  - **playwright-extra** - Pour les fonctionnalités avancées

### Gestion des Proxies
- **rotating-proxy-list** - Pour éviter les blocages
- **aiohttp-socks** - Pour le support des proxies SOCKS
- **proxy-database** - Pour la gestion des proxies
- **proxy-checker** - Pour la vérification des proxies

## 4. Module de Parsing et Traitement de CV

### Extraction de Texte PDF
- **PyPDF2** - Pour l'extraction basique
- **pdfminer.six** - Pour une extraction avancée
- **pdfplumber** - Pour l'extraction de tableaux
- **pdf2image** - Pour la conversion en images
- **pytesseract** - Pour l'OCR

### Traitement du Texte
- **spaCy** - Pour l'analyse NLP
  - Modèle français: fr_core_news_md
- **NLTK** - Pour le traitement linguistique
- **transformers** - Pour l'analyse sémantique
  - Modèle: paraphrase-multilingual-mpnet-base-v2
- **sentence-transformers** - Pour les embeddings
- **fasttext** - Pour la classification de texte

## 5. Module de Matching et Scoring

### Embeddings et Similarité Sémantique
- **Sentence-Transformers** - Pour les embeddings
- **scikit-learn** - Pour les calculs de similarité
- **numpy** - Pour les calculs numériques
- **pandas** - Pour l'analyse des données
- **faiss** - Pour la recherche vectorielle
- **annoy** - Pour les index approximatifs

### Intégration LLM Local
- **Ollama** (déjà installé en Docker)
  - Modèle: llama3:8b
- **LangChain** - Pour l'interaction avec Ollama
- **llama-index** - Pour l'indexation sémantique
- **llama-cpp-python** - Pour l'interface Python
- **llama-tokenizer-js** - Pour le tokenization

## 6. Module de Génération de Documents

### Génération de Texte
- **Ollama** avec templates personnalisés
- **Jinja2** - Pour le templating
- **prompt-toolkit** - Pour la gestion des prompts
- **langchain** - Pour la génération de texte
- **transformers** - Pour la génération de texte

### Création de Documents
- **python-docx** - Pour les fichiers Word
- **docxtpl** - Pour les templates Word
- **pdfkit** - Pour la conversion en PDF
- **weasyprint** - Alternative pour la conversion en PDF
- **reportlab** - Pour la génération de PDF
- **pypdf** - Pour la manipulation de PDF

## 7. Modules à Implémenter

### Détection des Doublons
- **difflib** - Pour la comparaison de texte
- **fuzzywuzzy** - Pour la correspondance floue
- **rapidfuzz** - Pour les comparaisons rapides
- **textdistance** - Pour les distances de texte
- **jellyfish** - Pour les comparaisons de chaînes

### Gestion des Domiciles
- **geopy** - Pour le géocodage
- **folium** - Pour la visualisation
- **polyline** - Pour les itinéraires
- **geojson** - Pour le stockage des données géographiques
- **shapely** - Pour les opérations géométriques
- **rtree** - Pour les index spatiaux

### Préférences de Recherche
- **pydantic** - Pour la validation
- **numpy** - Pour les calculs
- **pandas** - Pour l'analyse
- **scikit-learn** - Pour le machine learning
- **optuna** - Pour l'optimisation

### Suggestions IA
- **transformers** - Pour l'analyse
- **scikit-learn** - Pour les recommandations
- **numpy** - Pour les calculs
- **torch** - Pour le deep learning
- **lightgbm** - Pour le boosting

### Analyse du Feedback Kanban
- **pandas** - Pour l'analyse
- **scikit-learn** - Pour les patterns
- **matplotlib** - Pour la visualisation
- **plotly** - Pour les graphiques interactifs
- **seaborn** - Pour les visualisations statistiques

### Gestion des API LLM
- **httpx** - Pour les requêtes HTTP
- **pydantic** - Pour la validation
- **tenacity** - Pour les retries
- **backoff** - Pour le backoff exponentiel
- **aiohttp** - Pour les requêtes asynchrones

## 8. Scheduler et Automatisation

### Planification des Tâches
- **APScheduler** - Pour la planification
- **schedule** - Alternative légère
- **croniter** - Pour le parsing des expressions cron
- **celery** - Pour les tâches distribuées
- **dramatiq** - Pour les tâches asynchrones

### Logging et Monitoring
- **Loguru** - Pour les logs
- **structlog** - Pour le logging structuré
- **prometheus-client** - Pour les métriques
- **sentry-sdk** - Pour le monitoring des erreurs
- **opentelemetry** - Pour le tracing distribué

## 9. Conteneurisation et Déploiement

### Docker
- **Docker Compose** - Pour l'orchestration
- **NocoDB** - Pour l'interface Kanban
- **Ollama** - Pour le LLM local
- **Redis** (optionnel) - Pour le cache
- **PostgreSQL** (optionnel) - Pour la base de données
- **MinIO** (optionnel) - Pour le stockage d'objets

### Packaging Application
- **Tauri CLI** - Pour le packaging
- **PyInstaller** - Pour le backend
- **electron-builder** (alternative) - Pour le packaging
- **nsis** - Pour les installateurs Windows
- **appimagetool** - Pour les packages Linux
- **create-dmg** - Pour les packages macOS

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
