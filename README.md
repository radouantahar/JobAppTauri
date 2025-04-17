# MyJobApplicationApp

Une application de gestion de candidatures d'emploi développée avec Tauri, React et TypeScript.

## Fonctionnalités

- **Authentification** : Inscription, connexion et gestion de session
- **Gestion des profils** : Profil utilisateur, localisations et préférences
- **Gestion des offres** : Création, modification et recherche d'offres d'emploi
- **Gestion des candidatures** : Suivi des candidatures et des entretiens
- **Gestion des documents** : Stockage et gestion des CV, lettres de motivation et autres documents
- **Tableau Kanban** : Visualisation et organisation des candidatures
- **Recherche avancée** : Filtres et critères de recherche personnalisables

## Technologies

- **Frontend** : React, TypeScript, Mantine UI
- **Backend** : Tauri, Rust
- **Base de données** : SQLite avec tauri-plugin-sql
- **Tests** : Vitest, Cypress

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/MyJobApplicationApp.git
cd MyJobApplicationApp
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer l'application en mode développement :
```bash
npm run tauri dev
```

## Structure du Projet

```
app-tauri/
├── src-tauri/          # Code Rust (Tauri)
│   ├── src/
│   │   ├── commands/   # Commandes Tauri
│   │   ├── models/     # Modèles de données
│   │   └── tests/      # Tests Rust
│   └── tests/          # Tests d'intégration
└── src/                # Code React
    ├── components/     # Composants React
    ├── hooks/         # Hooks personnalisés
    ├── pages/         # Pages de l'application
    ├── services/      # Services API
    └── types/         # Types TypeScript
```

## Base de Données

L'application utilise SQLite avec tauri-plugin-sql pour la persistance des données. Les principales tables sont :

- `users` : Informations des utilisateurs
- `user_profiles` : Profils utilisateurs détaillés
- `jobs` : Offres d'emploi
- `applications` : Candidatures
- `documents` : Documents (CV, lettres de motivation, etc.)
- `application_stages` : Étapes des candidatures
- `application_notes` : Notes sur les candidatures
- `application_documents` : Documents liés aux candidatures

## Tests

### Tests Frontend
```bash
npm run test
```

### Tests Backend
```bash
cargo test
```

### Tests d'Intégration
```bash
npm run test:e2e
```

## Contribution

1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

MIT 