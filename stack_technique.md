# Stack Technique - Application d'Automatisation de Recherche d'Emploi

Ce document détaille les technologies, bibliothèques et outils spécifiques qui seront utilisés pour chaque composant de l'architecture de l'application.

## 1. Interface Utilisateur

### Framework Principal
- **Electron.js** - Framework pour applications desktop multi-plateformes
  - Avantages: Mature, large communauté, facilité d'intégration avec des technologies web
  - Alternatives considérées: Tauri (plus léger mais moins mature)

### Frontend
- **React.js** - Bibliothèque pour construire l'interface utilisateur
- **Tailwind CSS** - Framework CSS pour le design responsive
- **React DnD** - Pour les fonctionnalités de drag-and-drop du Kanban

### Interface Kanban
- **NocoDB** (déjà installé en Docker) - Pour la gestion des données en mode Kanban
  - Configuration via l'API REST de NocoDB pour l'intégration avec l'application

## 2. Backend et Stockage de Données

### Base de Données
- **SQLite** - Base de données locale légère
  - **SQLAlchemy** - ORM Python pour interagir avec la base de données
  - **Alembic** - Pour les migrations de schéma de base de données

### Serveur Local
- **FastAPI** - Framework Python pour créer une API REST locale
  - Servira d'intermédiaire entre l'interface utilisateur et les modules de traitement
  - Gestion des requêtes asynchrones pour les opérations de scraping

## 3. Module de Scraping

### Scraping d'Offres d'Emploi
- **JobSpy** (python-jobspy) - Bibliothèque principale pour le scraping des sites d'emploi
  - Supporte LinkedIn, Indeed, Glassdoor, Google Jobs, ZipRecruiter, etc.
  - Version: 1.1.79 (dernière version stable)

### Scraping de Temps de Transport
- **Selenium** - Pour l'automatisation du navigateur
  - **webdriver-manager** - Pour la gestion automatique des pilotes de navigateur
- **BeautifulSoup4** - Pour le parsing HTML des résultats de Google Maps
- **Playwright** (alternative) - Pour les cas où Selenium rencontrerait des limitations

### Gestion des Proxies (optionnel)
- **Rotating-proxy-list** - Pour éviter les blocages lors du scraping intensif

## 4. Module de Parsing et Traitement de CV

### Extraction de Texte PDF
- **PyPDF2** - Pour l'extraction basique de texte des PDF
- **pdfminer.six** - Pour une extraction plus avancée avec préservation de la structure

### Traitement du Texte
- **spaCy** - Pour l'analyse NLP, la reconnaissance d'entités nommées
  - Modèle français: fr_core_news_md
- **NLTK** - Pour le traitement linguistique complémentaire

## 5. Module de Matching et Scoring

### Embeddings et Similarité Sémantique
- **Sentence-Transformers** - Pour générer des embeddings de texte
  - Modèle: paraphrase-multilingual-mpnet-base-v2 (supporte le français)
- **scikit-learn** - Pour les calculs de similarité cosinus et autres métriques

### Intégration LLM Local
- **Ollama** (déjà installé en Docker) - Pour l'accès aux modèles LLM locaux
  - Modèle recommandé: llama3:8b (bon équilibre performance/ressources)
  - **LangChain** - Pour simplifier l'interaction avec Ollama

## 6. Module de Génération de Documents

### Génération de Texte
- **Ollama** avec templates de prompts personnalisés
- **Jinja2** - Pour le templating des documents générés

### Création de Documents
- **python-docx** - Pour la génération de fichiers Word (.docx)
  - Permet la mise en forme avancée des lettres de motivation et CV
- **docxtpl** - Pour l'utilisation de templates Word avec Jinja2

## 7. Scheduler et Automatisation

### Planification des Tâches
- **APScheduler** - Bibliothèque Python pour la planification des tâches
  - Alternative à cron, plus facile à intégrer dans l'application
- **schedule** - Alternative plus légère pour des besoins simples

### Logging et Monitoring
- **Loguru** - Pour la gestion avancée des logs
- **Prometheus Client** (optionnel) - Pour la collecte de métriques

## 8. Conteneurisation et Déploiement

### Docker
- Utilisation des conteneurs Docker existants:
  - **NocoDB** - Pour l'interface Kanban
  - **Ollama** - Pour le LLM local
- **Docker Compose** - Pour orchestrer les différents services

### Packaging Application
- **PyInstaller** - Pour créer un exécutable standalone de l'application Python
- **electron-builder** - Pour packager l'application Electron

## 9. Outils de Développement

### Environnement de Développement
- **Poetry** - Pour la gestion des dépendances Python
- **Node.js** et **npm** - Pour le développement frontend
- **ESLint** et **Prettier** - Pour le linting et le formatage du code JavaScript/TypeScript
- **Black** et **isort** - Pour le formatage du code Python

### Tests
- **Pytest** - Pour les tests unitaires et d'intégration en Python
- **Jest** - Pour les tests unitaires en JavaScript
- **Playwright Test** - Pour les tests end-to-end

## Compatibilité et Prérequis

### Système d'Exploitation
- Compatible avec Windows, macOS et Linux
- Recommandé: Ubuntu 20.04+ ou Windows 10+

### Matériel Recommandé
- CPU: 4 cœurs minimum
- RAM: 8 Go minimum (16 Go recommandé pour les LLM)
- Espace disque: 10 Go minimum

### Dépendances Système
- Python 3.10+
- Node.js 18+
- Docker et Docker Compose
- Navigateur Chrome ou Firefox (pour Selenium/Playwright)

## Considérations de Performance

- Les opérations de scraping sont exécutées de manière asynchrone pour ne pas bloquer l'interface utilisateur
- Le LLM local (via Ollama) peut être configuré pour utiliser moins de ressources si nécessaire
- Les tâches intensives sont planifiées pendant les périodes d'inactivité
