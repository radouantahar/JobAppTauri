# MyJobApplicationApp

Une application de gestion des candidatures d'emploi avec interface graphique moderne et fonctionnalités avancées.

## Fonctionnalités

### Tableau Kanban
- Gestion visuelle des candidatures avec un tableau Kanban
- Colonnes personnalisables pour suivre l'état des candidatures
- Drag & drop pour déplacer facilement les cartes entre les colonnes
- Modal détaillée pour chaque candidature
- Synchronisation automatique avec la base de données
- Gestion des erreurs et indicateurs de chargement
- Tests unitaires complets

### Recherche d'Emploi
- Interface de recherche avancée
- Filtres personnalisables
- Résultats en temps réel
- Sauvegarde des préférences de recherche

### Gestion des Documents
- Upload et gestion des CV
- Templates de lettres de motivation
- Suivi des versions des documents

### Tableau de Bord
- Statistiques de candidatures
- Graphiques d'évolution
- Suivi des offres

## Installation

1. Cloner le dépôt
```bash
git clone https://github.com/votre-username/MyJobApplicationApp.git
cd MyJobApplicationApp
```

2. Installer les dépendances
```bash
# Installer les dépendances Rust
cargo install tauri-cli

# Installer les dépendances Node.js
cd app-tauri
npm install
```

3. Lancer l'application en mode développement
```bash
npm run tauri dev
```

## Structure du Projet

```
MyJobApplicationApp/
├── app-tauri/              # Application Tauri
│   ├── src/               # Code source TypeScript/React
│   ├── src-tauri/         # Code source Rust
│   └── tests/             # Tests unitaires
├── modules/               # Modules Python
├── docs/                  # Documentation
└── docker/                # Configuration Docker
```

## Tests

Les tests sont écrits avec Jest et React Testing Library. Pour lancer les tests :

```bash
cd app-tauri
npm test
```

## Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 