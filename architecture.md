# Architecture de l'Application d'Automatisation de Recherche d'Emploi

## Vue d'Ensemble

L'application est conçue comme une application desktop locale utilisant Tauri, avec une interface utilisateur moderne et des fonctionnalités avancées d'automatisation. L'architecture est modulaire et extensible, permettant une maintenance et des mises à jour faciles.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Interface Tauri                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Dashboard  │  │  Kanban     │  │  Profil     │  │  Paramètres │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Backend Python                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Scraping   │  │  Matching   │  │  Génération │  │  Analyse    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Stockage Local                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  SQLite     │  │  Cache      │  │  Fichiers   │  │  NocoDB     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Composants Principaux

### 1. Interface Utilisateur (Tauri + React)

#### Dashboard
- Vue d'ensemble des candidatures en cours
- Statistiques et métriques clés
- Alertes et notifications
- Accès rapide aux fonctionnalités principales

#### Interface Kanban
- Intégration avec NocoDB pour la gestion visuelle
- Colonnes personnalisables (À postuler, En cours, etc.)
- Filtres et recherches avancées
- Drag-and-drop pour la gestion des candidatures

#### Gestion des Profils
- Gestion des CV et lettres de motivation
- Configuration des préférences de recherche
- Gestion des adresses et trajets
- Historique des candidatures

#### Paramètres
- Configuration des sources de scraping
- Paramètres de matching et scoring
- Préférences de notification
- Gestion des API externes

### 2. Module de Scraping

#### Scraping d'Offres
- Support multi-sources (LinkedIn, Indeed, etc.)
- Détection automatique des doublons
- Filtrage intelligent basé sur les préférences
- Mise en cache des résultats

#### Scraping de Transport
- Calcul des temps de trajet multi-domiciles
- Support multi-modes de transport
- Visualisation des itinéraires
- Mise à jour périodique des données

### 3. Module de Matching et Scoring

#### Analyse Sémantique
- Embeddings locaux avec Sentence-Transformers
- Similarité cosinus pour le matching
- Pondération des critères
- Détection des doublons avancée

#### Intégration LLM
- Utilisation d'Ollama en local
- Génération de suggestions personnalisées
- Analyse des feedbacks
- Amélioration continue des scores

### 4. Module de Génération de Documents

#### Templates
- Système de templates modulaire
- Support multi-formats (Word, PDF)
- Variables dynamiques
- Validation des documents

#### Génération
- Utilisation de LLM local
- Personnalisation contextuelle
- Vérification automatique
- Historique des versions

### 5. Modules à Implémenter

#### Détection des Doublons
- Analyse de similarité textuelle
- Comparaison des métadonnées
- Fusion intelligente des informations
- Historique des doublons détectés

#### Gestion des Domiciles
- Stockage des adresses multiples
- Calcul des temps de trajet
- Visualisation des itinéraires
- Optimisation des trajets

#### Préférences de Recherche
- Configuration des critères
- Pondération des éléments
- Historique des recherches
- Suggestions d'optimisation

#### Suggestions IA
- Analyse des tendances
- Recommandations personnalisées
- Optimisation des candidatures
- Feedback continu

#### Analyse du Feedback Kanban
- Tracking des mouvements
- Analyse des patterns
- Suggestions d'amélioration
- Métriques de performance

#### Gestion des API LLM
- Configuration des modèles
- Gestion des quotas
- Fallback automatique
- Monitoring des performances

## Flux de Données

1. **Collecte Initiale**
   - Scraping des offres d'emploi
   - Calcul des temps de trajet
   - Détection des doublons
   - Stockage en SQLite

2. **Traitement**
   - Matching avec le profil
   - Scoring des offres
   - Génération de suggestions
   - Mise à jour du Kanban

3. **Feedback**
   - Analyse des actions utilisateur
   - Amélioration des scores
   - Optimisation des suggestions
   - Mise à jour des préférences

## Stockage des Données

### Base de Données SQLite
- Schéma relationnel optimisé
- Index pour les recherches fréquentes
- Triggers pour l'intégrité
- Vues pour l'analyse

### Cache Local
- Redis pour les données temporaires
- Mise en cache des résultats de scraping
- Stockage des embeddings
- Gestion des sessions

### Fichiers Locaux
- CV et lettres de motivation
- Templates personnalisés
- Logs et métriques
- Configurations utilisateur

### NocoDB
- Interface Kanban
- Collaboration en temps réel
- Historique des modifications
- Export des données

## Sécurité

### Protection des Données
- Chiffrement des données sensibles
- Gestion sécurisée des mots de passe
- Validation des entrées
- Audit des accès

### Isolation
- Sandboxing avec Tauri
- Conteneurisation des services
- Séparation des privilèges
- Gestion des permissions

## Extensions Futures

### Analyse de Marché
- Tracking des tendances
- Analyse des salaires
- Benchmark des compétences
- Prédictions de marché

### Intégrations
- Calendriers (Google, Outlook)
- Messagerie professionnelle
- Réseaux sociaux
- Plateformes de formation
