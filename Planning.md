# Planification du Projet

## Architecture

### Frontend
- React avec TypeScript
- Mantine UI pour les composants
- React Router pour la navigation
- Zustand pour la gestion d'état
- Vitest pour les tests
- Testing Library pour les tests d'intégration
- Jest DOM pour les assertions de test

### Backend
- Tauri pour l'application desktop
- SQLite pour la base de données
- tauri-plugin-sql pour l'accès à la base de données
- Système de migrations pour la base de données
- Système de backup automatique

## Structure des Dossiers
```
app-tauri/
  ├── src/
  │   ├── components/        # Composants React
  │   │   └── __tests__/    # Tests des composants
  │   ├── types/            # Types TypeScript
  │   ├── hooks/            # Hooks personnalisés
  │   ├── services/         # Services et API
  │   ├── utils/            # Utilitaires
  │   └── __tests__/        # Tests et helpers
  ├── src-tauri/            # Code Rust pour Tauri
  └── public/               # Fichiers statiques
```

## Conventions de Code

### TypeScript
- Utiliser des types stricts
- Éviter les `any`
- Utiliser des interfaces pour les props
- Documenter les types complexes
- Utiliser des types utilitaires pour les props optionnelles
- Utiliser des types personnalisés pour les chaînes ISO

### Tests
- Tests unitaires pour chaque composant
- Tests d'intégration pour les flux principaux
- Tests d'accessibilité
- Tests de performance
- Utiliser des fixtures pour les données mockées
- Créer des helpers de test pour les objets complexes

### Documentation
- Commentaires JSDoc pour les fonctions
- Documentation des composants
- Guide de contribution
- Guide de déploiement
- Documentation des types
- Guide des tests unitaires

## Workflow de Développement

1. Créer une branche pour chaque fonctionnalité
2. Écrire les tests avant le code
3. Faire des revues de code
4. Maintenir la couverture de tests
5. Documenter les changements
6. Mettre à jour TASK.md
7. Vérifier les règles de développement

## Standards de Qualité

- Respecter les règles ESLint
- Maintenir une couverture de tests > 80%
- Vérifier l'accessibilité
- Optimiser les performances
- Documenter les changements majeurs
- Suivre les conventions de nommage
- Maintenir la cohérence des types

## Déploiement

### Prérequis
- Node.js >= 18
- Rust >= 1.70
- SQLite
- Git

### Étapes
1. Installer les dépendances
2. Construire l'application
3. Tester l'application
4. Créer l'installateur
5. Vérifier la signature
6. Publier la version
7. Mettre à jour la documentation 