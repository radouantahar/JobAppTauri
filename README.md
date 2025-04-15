# MyJobApplicationApp

Une application desktop moderne pour automatiser et optimiser votre recherche d'emploi. Développée avec Tauri, React et Python, elle combine scraping intelligent, analyse de CV, calcul de temps de trajet et génération de contenu personnalisé.

## 🚀 Fonctionnalités Principales

- **Scraping Intelligent**
  - Support multi-sources (LinkedIn, Indeed, etc.)
  - Détection automatique des doublons
  - Filtrage intelligent des offres
  - Mise en cache des résultats

- **Analyse et Matching**
  - Analyse sémantique des offres
  - Scoring personnalisé basé sur votre profil
  - Suggestions IA pour les candidatures
  - Feedback continu sur les performances

- **Gestion des Candidatures**
  - Interface Kanban intuitive
  - Suivi des temps de trajet
  - Génération de documents personnalisés
  - Historique des candidatures

- **Optimisation**
  - Analyse des temps de trajet
  - Détection des doublons
  - Suggestions IA personnalisées
  - Métriques de performance

## 📋 Prérequis

### Système d'exploitation
- Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+, Fedora 34+)

### Développement
- Python 3.10+ avec pip
- Node.js 18+ avec npm
- Rust 1.70+ avec cargo
- Git

### Services
- Docker et Docker Compose
- SQLite 3
- NocoDB (via Docker)
- Ollama (via Docker)

## 🔧 Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-username/MyJobApplicationApp.git
   cd MyJobApplicationApp
   ```

2. **Configurer l'environnement Python**
   ```bash
   # Créer un environnement virtuel
   python -m venv venv
   
   # Activer l'environnement
   # Windows
   .\venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   
   # Installer les dépendances Python
   pip install -r requirements.txt
   ```

3. **Configurer l'environnement Node.js**
   ```bash
   cd app-tauri
   npm install
   ```

4. **Configurer l'environnement Rust**
   ```bash
   # Mettre à jour Rust
   rustup update
   
   # Installer les outils nécessaires
   rustup target add wasm32-unknown-unknown
   cargo install tauri-cli
   ```

5. **Configurer les services Docker**
   ```bash
   # Créer le fichier .env si nécessaire
   cp .env.example .env
   
   # Lancer les services
   docker-compose up -d
   
   # Vérifier que les services sont en cours d'exécution
   docker-compose ps
   ```

6. **Initialiser la base de données**
   ```bash
   # Exécuter les migrations
   python -m alembic upgrade head
   ```

7. **Lancer l'application en mode développement**
   ```bash
   # Dans le dossier app-tauri
   npm run tauri dev
   ```

### Vérification de l'installation

Pour vérifier que tout est correctement installé :

1. **Vérifier les versions**
   ```bash
   python --version  # Doit afficher Python 3.10+
   node --version   # Doit afficher v18+
   rustc --version  # Doit afficher rustc 1.70+
   ```

2. **Vérifier les services Docker**
   ```bash
   docker-compose ps
   # Doit afficher :
   # - noco-db (running)
   # - ollama (running)
   ```

3. **Vérifier l'application**
   - L'application devrait se lancer en mode développement
   - La page d'accueil devrait s'afficher
   - Les services devraient être accessibles

### Dépannage

Si vous rencontrez des problèmes :

1. **Erreurs Python**
   - Vérifier que l'environnement virtuel est activé
   - Réinstaller les dépendances : `pip install -r requirements.txt`

2. **Erreurs Node.js**
   - Nettoyer le cache : `npm cache clean --force`
   - Réinstaller les dépendances : `npm install`

3. **Erreurs Docker**
   - Vérifier que Docker est en cours d'exécution
   - Redémarrer les services : `docker-compose restart`

4. **Erreurs Rust**
   - Mettre à jour Rust : `rustup update`
   - Vérifier les outils : `rustup show`

## 🛠 Configuration Initiale

1. **Configurer les préférences utilisateur**
   - Accédez aux paramètres de l'application
   - Définissez vos critères de recherche
   - Configurez vos adresses de domicile

2. **Importer votre CV**
   - Allez dans la section Documents
   - Importez votre CV au format PDF ou DOCX
   - L'application analysera automatiquement votre profil

3. **Définir les critères de recherche**
   - Spécifiez vos compétences clés
   - Définissez votre salaire souhaité
   - Configurez les filtres de localisation

4. **Configurer les adresses de domicile**
   - Ajoutez vos adresses de résidence
   - Configurez les modes de transport
   - Définissez les temps de trajet maximum

## 📖 Guide d'Utilisation

### Recherche d'Emploi

1. **Lancer une recherche**
   - Accédez à la page de recherche
   - Les offres sont automatiquement scrapées
   - Utilisez les filtres pour affiner les résultats

2. **Analyser les offres**
   - Consultez le score de matching
   - Vérifiez les temps de trajet
   - Lisez les suggestions IA

3. **Gérer les candidatures**
   - Glissez-déposez les offres dans le Kanban
   - Suivez l'état de vos candidatures
   - Générez les documents nécessaires

### Gestion des Documents

1. **Générer des documents**
   - Sélectionnez un template
   - Personnalisez le contenu
   - Exportez au format souhaité

2. **Suivre les versions**
   - Consultez l'historique des modifications
   - Comparez les différentes versions
   - Restaurez une version précédente

### Analyse et Optimisation

1. **Consulter les statistiques**
   - Visualisez vos performances
   - Analysez les temps de réponse
   - Suivez les taux de succès

2. **Optimiser votre recherche**
   - Ajustez vos critères
   - Améliorez votre profil
   - Suivez les suggestions IA

## 🧪 Tests

L'application inclut une suite complète de tests :

- Tests unitaires pour les composants
- Tests de performance
- Tests d'intégration
- Tests de sécurité

Pour lancer les tests :

```bash
# Tests frontend
cd app-tauri
npm test

# Tests backend
python -m pytest
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre guide de contribution pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub ou nous contacter via email. 