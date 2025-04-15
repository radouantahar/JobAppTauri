# Documentation de l'API MyJobApplicationApp

## Table des matières
1. [Authentification](#authentification)
2. [Gestion des utilisateurs](#gestion-des-utilisateurs)
3. [Gestion des offres d'emploi](#gestion-des-offres-demploi)
4. [Gestion des documents](#gestion-des-documents)
5. [Gestion du Kanban](#gestion-du-kanban)
6. [Statistiques](#statistiques)

## Authentification

### Connexion
```typescript
login(email: string, password: string): Promise<User>
```
- **Description**: Permet à un utilisateur de se connecter à l'application
- **Paramètres**:
  - `email`: Adresse email de l'utilisateur
  - `password`: Mot de passe de l'utilisateur
- **Retour**: Objet `User` contenant les informations de l'utilisateur
- **Erreurs possibles**:
  - `AppError::Auth`: Identifiants invalides
  - `AppError::Database`: Erreur de base de données

### Inscription
```typescript
register(email: string, password: string): Promise<User>
```
- **Description**: Permet d'inscrire un nouvel utilisateur
- **Paramètres**:
  - `email`: Adresse email de l'utilisateur
  - `password`: Mot de passe de l'utilisateur
- **Retour**: Objet `User` contenant les informations de l'utilisateur créé
- **Erreurs possibles**:
  - `AppError::Validation`: Email invalide ou mot de passe trop court
  - `AppError::Database`: Erreur de base de données

## Gestion des utilisateurs

### Obtenir le profil utilisateur
```typescript
get_user_profile(): Promise<UserProfile>
```
- **Description**: Récupère le profil de l'utilisateur connecté
- **Retour**: Objet `UserProfile` contenant les informations du profil
- **Erreurs possibles**:
  - `AppError::NotFound`: Profil non trouvé
  - `AppError::Database`: Erreur de base de données

### Mettre à jour le profil utilisateur
```typescript
update_user_profile(profile: UserProfile): Promise<void>
```
- **Description**: Met à jour le profil de l'utilisateur
- **Paramètres**:
  - `profile`: Objet `UserProfile` contenant les nouvelles informations
- **Erreurs possibles**:
  - `AppError::Validation`: Données invalides
  - `AppError::Database`: Erreur de base de données

## Gestion des offres d'emploi

### Rechercher des offres
```typescript
search_jobs(criteria: SearchCriteria): Promise<Job[]>
```
- **Description**: Recherche des offres d'emploi selon des critères
- **Paramètres**:
  - `criteria`: Objet `SearchCriteria` contenant les critères de recherche
- **Retour**: Liste d'objets `Job` correspondant aux critères
- **Erreurs possibles**:
  - `AppError::Validation`: Critères de recherche invalides
  - `AppError::Database`: Erreur de base de données

### Obtenir les statistiques des offres
```typescript
get_job_stats(): Promise<JobStats>
```
- **Description**: Récupère les statistiques des offres d'emploi
- **Retour**: Objet `JobStats` contenant les statistiques
- **Erreurs possibles**:
  - `AppError::Database`: Erreur de base de données

## Gestion des documents

### Obtenir les templates de documents
```typescript
get_document_templates(): Promise<DocumentTemplate[]>
```
- **Description**: Récupère la liste des templates de documents disponibles
- **Retour**: Liste d'objets `DocumentTemplate`
- **Erreurs possibles**:
  - `AppError::Database`: Erreur de base de données

### Créer un document
```typescript
create_document(user_id: number, title: string, content: string, document_type: string): Promise<Document>
```
- **Description**: Crée un nouveau document
- **Paramètres**:
  - `user_id`: ID de l'utilisateur
  - `title`: Titre du document
  - `content`: Contenu du document
  - `document_type`: Type de document
- **Retour**: Objet `Document` créé
- **Erreurs possibles**:
  - `AppError::Validation`: Données invalides
  - `AppError::Database`: Erreur de base de données

## Gestion du Kanban

### Obtenir les colonnes du Kanban
```typescript
get_kanban_columns(): Promise<KanbanColumn[]>
```
- **Description**: Récupère la liste des colonnes du Kanban
- **Retour**: Liste d'objets `KanbanColumn`
- **Erreurs possibles**:
  - `AppError::Database`: Erreur de base de données

### Déplacer une carte
```typescript
move_kanban_card(card_id: number, to_column_id: number, position: number): Promise<boolean>
```
- **Description**: Déplace une carte dans le Kanban
- **Paramètres**:
  - `card_id`: ID de la carte à déplacer
  - `to_column_id`: ID de la colonne de destination
  - `position`: Nouvelle position dans la colonne
- **Retour**: `true` si le déplacement a réussi
- **Erreurs possibles**:
  - `AppError::NotFound`: Carte ou colonne non trouvée
  - `AppError::Database`: Erreur de base de données

## Statistiques

### Obtenir les statistiques de candidature
```typescript
get_application_stats(): Promise<ApplicationStats>
```
- **Description**: Récupère les statistiques des candidatures
- **Retour**: Objet `ApplicationStats` contenant les statistiques
- **Erreurs possibles**:
  - `AppError::Database`: Erreur de base de données

## Types de données

### User
```typescript
interface User {
  id: number;
  email: string;
  password_hash: string;
}
```

### UserProfile
```typescript
interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  locations: UserLocations;
  cv: CVInfo;
  preferences?: any;
  job_preferences?: any;
}
```

### Job
```typescript
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_range?: string;
  matching_score: number;
  status: string;
  source: string;
}
```

### DocumentTemplate
```typescript
interface DocumentTemplate {
  id: number;
  name: string;
  template_type: string;
  content: string;
  variables?: string[];
  is_default?: boolean;
  language?: string;
}
```

### KanbanColumn
```typescript
interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
}
```

### JobStats
```typescript
interface JobStats {
  total_jobs: number;
  trend_data: TrendData;
  source_distribution: DistributionData;
}
```

### ApplicationStats
```typescript
interface ApplicationStats {
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  success_rate: number;
}
``` 