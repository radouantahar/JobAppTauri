# Documentation Complète - Application d'Automatisation de Recherche d'Emploi

## Introduction

Cette application est conçue pour automatiser et optimiser le processus de recherche d'emploi. Elle utilise Tauri comme framework principal, combinant la puissance de Rust pour le backend et React pour l'interface utilisateur.

### Fonctionnalités Principales
- Scraping automatique des offres d'emploi
- Analyse et matching intelligent
- Gestion des candidatures via interface Kanban
- Génération de documents personnalisés
- Analyse des temps de trajet
- Détection des doublons
- Suggestions IA personnalisées
- Préchargement intelligent des données
- Gestion des erreurs avec retry automatique

## Installation et Configuration

### Prérequis
- Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+, Fedora 34+)
- Python 3.10+
- Node.js 18+
- Rust 1.70+
- Docker et Docker Compose

### Installation
1. Cloner le dépôt
```bash
git clone https://github.com/radouantahar/JobAppTauri.git
cd JobAppTauri
```

2. Installer les dépendances Python
```bash
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` sous Windows
pip install -r requirements.txt
```

3. Installer les dépendances Node.js
```bash
cd app-tauri
npm install
```

4. Configurer l'environnement Rust
```bash
rustup update
cargo install tauri-cli
```

5. Lancer les services Docker
```bash
docker-compose up -d
```

### Configuration Initiale
1. Configurer les préférences utilisateur
2. Importer le CV
3. Définir les critères de recherche
4. Configurer les adresses de domicile

## Architecture

### Interface Utilisateur (Tauri + React)
- Dashboard personnalisable
- Interface Kanban avec NocoDB
- Gestion des profils
- Paramètres de configuration
- Système de préchargement intelligent
- Gestion des erreurs avec retry

### Backend Python
- Modules de scraping
- Système de matching
- Génération de documents
- Analyse des données
- Gestion des erreurs
- Système de cache

### Stockage de Données
- Base SQLite locale
- Cache Redis
- Fichiers locaux
- Synchronisation NocoDB

## Utilisation

### Recherche d'Emploi
1. Configurer les préférences
2. Lancer le scraping
3. Analyser les résultats
4. Gérer les candidatures
5. Utiliser les filtres dynamiques
6. Prévisualiser les temps de trajet

### Gestion des Candidatures
1. Visualiser les offres dans le Kanban
2. Déplacer les offres entre les colonnes
3. Générer les documents
4. Suivre les réponses
5. Analyser les statistiques

### Analyse et Optimisation
1. Consulter les suggestions IA
2. Analyser les temps de trajet
3. Optimiser les critères de recherche
4. Suivre les statistiques
5. Utiliser le système de préchargement

## Modules

### Scraping
- Support multi-sources
- Détection des doublons
- Filtrage intelligent
- Mise en cache
- Gestion des erreurs avec retry

### Matching
- Analyse sémantique
- Scoring personnalisé
- Suggestions IA
- Feedback continu
- Préchargement des données

### Génération de Documents
- Templates personnalisables
- Support multi-formats
- Validation automatique
- Historique des versions
- Génération IA

### Analyse
- Tracking des mouvements
- Analyse des patterns
- Suggestions d'amélioration
- Métriques de performance
- Analyse des temps de trajet

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

## Maintenance

### Nettoyage
- Suppression automatique des offres expirées
- Archivage des anciennes candidatures
- Optimisation de la base de données
- Gestion du cache

### Mises à Jour
- Procédure de mise à jour
- Sauvegarde des données
- Migration du schéma
- Tests de compatibilité

## Dépannage

### Problèmes Courants
- Erreurs de scraping
- Problèmes de synchronisation
- Performances lentes
- Erreurs d'interface

### Solutions
- Vérification des logs
- Réinitialisation du cache
- Mise à jour des dépendances
- Support technique

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

## Contribution

### Développement
- Structure du projet
- Standards de code
- Tests requis
- Processus de revue

### Documentation
- Mise à jour des documents
- Ajout d'exemples
- Correction d'erreurs
- Amélioration des guides

## Support

### Ressources
- Documentation en ligne
- Forum communautaire
- Base de connaissances
- Tutoriels vidéo

### Contact
- Support technique
- Suggestions d'amélioration
- Signalement de bugs
- Demandes de fonctionnalités

## Système de Préchargement des Données

### Vue d'ensemble
Le système de préchargement des données permet d'optimiser le chargement initial de l'application en chargeant les données fréquemment utilisées en arrière-plan.

### Fonctionnalités
- Préchargement des jobs récents
- Préchargement des documents
- Préchargement des cartes Kanban
- Gestion des erreurs avec retry automatique
- Indicateurs de progression
- Tests de performance

### Composants Principaux

#### Hook usePreloadData
```typescript
const {
  isPreloading,
  preloadProgress,
  preloadError,
  retryPreload
} = usePreloadData();
```

#### Composant PreloadProgress
Affiche la progression du préchargement et gère les erreurs.

### Tests de Performance
Les tests de performance vérifient :
- Temps de préchargement < 2000ms
- Gestion des erreurs avec retry
- Stabilité de la mémoire
- Nettoyage des ressources

### Configuration
- Taille des lots : 10 éléments
- Délai entre les lots : 100ms
- Nombre maximum de retries : 3

## Tests de Performance du Système de Préchargement

### Vue d'ensemble
Les tests de performance du système de préchargement vérifient la rapidité, la stabilité et l'efficacité du chargement des données.

### Critères de Performance
1. **Temps de Préchargement**
   - Objectif : < 2000ms pour le chargement complet
   - Mesure : Utilisation de `performance.now()`
   - Scénario : Chargement de 50 jobs, 20 documents, 30 cartes Kanban

2. **Gestion des Erreurs**
   - Objectif : < 4000ms avec retry automatique
   - Scénario : Simulation d'erreurs réseau avec retry
   - Vérification : Nettoyage correct des erreurs

3. **Utilisation Mémoire**
   - Objectif : < 10MB d'augmentation
   - Mesure : `performance.memory.usedJSHeapSize`
   - Scénario : Multiples préchargements consécutifs

4. **Nettoyage des Ressources**
   - Objectif : < 100ms pour le nettoyage
   - Scénario : Démontage du composant
   - Vérification : Libération des ressources

### Configuration des Tests
```typescript
const mockJobs: Job[] = Array.from({ length: 50 }, ...);
const mockDocuments: Document[] = Array.from({ length: 20 }, ...);
const mockKanbanCards: KanbanCard[] = Array.from({ length: 30 }, ...);
```

### Bonnes Pratiques
- Utilisation de `vi.mock()` pour les dépendances
- Simulation réaliste des données
- Tests asynchrones avec `act()`
- Mesures précises avec `performance.now()`
- Vérification de la stabilité mémoire

## Tests de Performance des Hooks

### useJobSearch
1. **Temps de Recherche**
   - Objectif : < 1000ms pour une recherche simple
   - Mesure : `performance.now()`
   - Scénario : Recherche avec filtres de base

2. **Gestion de la Pagination**
   - Objectif : < 500ms pour charger plus de résultats
   - Scénario : Chargement de 20 jobs supplémentaires
   - Vérification : Mise à jour correcte de l'état

3. **Utilisation Mémoire**
   - Objectif : < 5MB d'augmentation par page
   - Mesure : `performance.memory.usedJSHeapSize`
   - Scénario : Navigation sur 5 pages

### useJob
1. **Temps de Chargement**
   - Objectif : < 500ms pour charger un job
   - Mesure : `performance.now()`
   - Scénario : Chargement d'un job complet

2. **Gestion des Mises à Jour**
   - Objectif : < 300ms pour mettre à jour un job
   - Scénario : Modification des détails d'un job
   - Vérification : Propagation des changements

3. **Optimisation Mémoire**
   - Objectif : Pas de fuite mémoire
   - Mesure : `performance.memory.usedJSHeapSize`
   - Scénario : Multiples mises à jour

### Bonnes Pratiques Communes
- Utilisation de `vi.mock()` pour les services
- Simulation réaliste des données
- Tests asynchrones avec `act()`
- Mesures précises avec `performance.now()`
- Vérification de la stabilité mémoire

## Gestion de la Base de Données avec sqlx

### Configuration
1. Installation des dépendances :
```bash
cargo add sqlx --features runtime-tokio-rustls,sqlite,chrono,uuid
cargo install sqlx-cli
```

2. Configuration de la base de données :
```rust
use sqlx::sqlite::SqlitePoolOptions;

async fn init_db() -> Result<sqlx::Pool<sqlx::Sqlite>, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite:app.db")
        .await?;
    
    sqlx::migrate!().run(&pool).await?;
    
    Ok(pool)
}
```

### Bonnes Pratiques
1. **Gestion des Connexions** :
   - Utiliser un pool de connexions
   - Limiter le nombre de connexions simultanées
   - Gérer proprement les erreurs de connexion

2. **Transactions** :
   - Utiliser les transactions pour les opérations multiples
   - Gérer les rollbacks en cas d'erreur
   - Isoler les opérations critiques

3. **Requêtes** :
   - Utiliser les macros sqlx pour la vérification au moment de la compilation
   - Préparer les requêtes fréquentes
   - Utiliser les paramètres nommés pour plus de clarté

4. **Migrations** :
   - Versionner les migrations
   - Tester les migrations avant de les appliquer
   - Sauvegarder la base de données avant les migrations

### Exemples d'Utilisation
```rust
// Exemple de repository
pub struct UserRepository {
    pool: sqlx::Pool<sqlx::Sqlite>,
}

impl UserRepository {
    pub fn new(pool: sqlx::Pool<sqlx::Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            SELECT * FROM users
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, user: User) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO users (id, username, email, password_hash, created_at, preferences, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            user.id,
            user.username,
            user.email,
            user.password_hash,
            user.created_at,
            user.preferences,
            user.settings
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
```

### Tests
1. **Tests de Base de Données** :
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn setup_test_db() -> sqlx::Pool<sqlx::Sqlite> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(":memory:")
            .await
            .unwrap();
        
        sqlx::migrate!().run(&pool).await.unwrap();
        
        pool
    }

    #[tokio::test]
    async fn test_create_user() {
        let pool = setup_test_db().await;
        let repo = UserRepository::new(pool);
        
        let user = User {
            id: Uuid::new_v4(),
            username: "test".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "hash".to_string(),
            created_at: Utc::now(),
            last_login: None,
            preferences: serde_json::json!({}),
            settings: serde_json::json!({}),
        };

        repo.create(user.clone()).await.unwrap();
        
        let found = repo.find_by_id(user.id).await.unwrap().unwrap();
        assert_eq!(found.username, user.username);
    }
}
```