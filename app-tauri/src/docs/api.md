# Documentation de l'API

## Authentification

### POST /api/auth/login
Authentifie un utilisateur.

**Paramètres:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Réponse:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

### POST /api/auth/register
Crée un nouveau compte utilisateur.

**Paramètres:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Réponse:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

## Offres d'emploi

### GET /api/jobs
Récupère la liste des offres d'emploi.

**Paramètres de requête:**
- `page`: number (défaut: 1)
- `limit`: number (défaut: 10)
- `keywords`: string[]
- `location`: string
- `jobType`: JobType[]
- `datePosted`: DatePostedOption
- `salary`: { min: number, max: number }

**Réponse:**
```json
{
  "jobs": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "location": "string",
      "description": "string",
      "url": "string",
      "publishedAt": "string",
      "salary": {
        "min": number,
        "max": number,
        "currency": "string"
      },
      "jobType": "string",
      "experienceLevel": "string",
      "skills": "string[]",
      "commuteTimes": {
        "primaryHome": {
          "time": number,
          "mode": "string"
        }
      }
    }
  ],
  "total": number
}
```

### POST /api/jobs
Crée une nouvelle offre d'emploi.

**Paramètres:**
```json
{
  "title": "string",
  "company": "string",
  "location": "string",
  "description": "string",
  "url": "string",
  "salary": {
    "min": number,
    "max": number,
    "currency": "string"
  },
  "jobType": "string",
  "experienceLevel": "string",
  "skills": "string[]"
}
```

**Réponse:**
```json
{
  "id": "string",
  "title": "string",
  "company": "string",
  "location": "string",
  "description": "string",
  "url": "string",
  "publishedAt": "string",
  "salary": {
    "min": number,
    "max": number,
    "currency": "string"
  },
  "jobType": "string",
  "experienceLevel": "string",
  "skills": "string[]"
}
```

## Documents

### GET /api/documents
Récupère la liste des documents.

**Paramètres de requête:**
- `page`: number (défaut: 1)
- `limit`: number (défaut: 10)

**Réponse:**
```json
{
  "documents": [
    {
      "id": "string",
      "title": "string",
      "type": "string",
      "content": "string",
      "lastUpdated": "string",
      "metadata": {
        "template": "string",
        "version": "string"
      }
    }
  ],
  "total": number
}
```

### POST /api/documents
Crée un nouveau document.

**Paramètres:**
```json
{
  "title": "string",
  "type": "string",
  "content": "string",
  "metadata": {
    "template": "string",
    "version": "string"
  }
}
```

**Réponse:**
```json
{
  "id": "string",
  "title": "string",
  "type": "string",
  "content": "string",
  "lastUpdated": "string",
  "metadata": {
    "template": "string",
    "version": "string"
  }
}
```

## Kanban

### GET /api/kanban
Récupère le tableau Kanban.

**Réponse:**
```json
{
  "id": "string",
  "title": "string",
  "columns": [
    {
      "id": "string",
      "title": "string",
      "cards": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "dueDate": "string",
          "priority": "string",
          "status": "string"
        }
      ]
    }
  ],
  "lastUpdated": "string"
}
```

### POST /api/kanban
Crée un nouveau tableau Kanban.

**Paramètres:**
```json
{
  "title": "string",
  "columns": [
    {
      "title": "string",
      "cards": []
    }
  ]
}
```

**Réponse:**
```json
{
  "id": "string",
  "title": "string",
  "columns": [
    {
      "id": "string",
      "title": "string",
      "cards": []
    }
  ],
  "lastUpdated": "string"
}
```

## Gestion des erreurs

### Format de réponse d'erreur
Toutes les réponses d'erreur suivent le même format :

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {
      "field": "string",
      "reason": "string"
    }[]
  }
}
```

### Codes d'erreur détaillés

#### 400 - Requête invalide
- `INVALID_EMAIL`: Format d'email invalide
- `INVALID_PASSWORD`: Le mot de passe ne respecte pas les critères de sécurité
- `MISSING_FIELD`: Champ obligatoire manquant
- `INVALID_DATE`: Format de date invalide
- `INVALID_TYPE`: Type de données invalide
- `INVALID_RANGE`: Valeur en dehors des limites acceptées

#### 401 - Non authentifié
- `INVALID_CREDENTIALS`: Email ou mot de passe incorrect
- `EXPIRED_TOKEN`: Token d'authentification expiré
- `INVALID_TOKEN`: Token d'authentification invalide
- `MISSING_TOKEN`: Token d'authentification manquant

#### 403 - Non autorisé
- `FORBIDDEN_ACTION`: Action non autorisée pour cet utilisateur
- `INSUFFICIENT_PERMISSIONS`: Permissions insuffisantes
- `ACCOUNT_LOCKED`: Compte temporairement bloqué
- `EMAIL_NOT_VERIFIED`: Email non vérifié

#### 404 - Ressource non trouvée
- `USER_NOT_FOUND`: Utilisateur non trouvé
- `JOB_NOT_FOUND`: Offre d'emploi non trouvée
- `DOCUMENT_NOT_FOUND`: Document non trouvé
- `KANBAN_NOT_FOUND`: Tableau Kanban non trouvé
- `RESOURCE_NOT_FOUND`: Ressource non trouvée

#### 500 - Erreur serveur
- `INTERNAL_ERROR`: Erreur interne du serveur
- `DATABASE_ERROR`: Erreur de base de données
- `EXTERNAL_SERVICE_ERROR`: Erreur d'un service externe
- `UNKNOWN_ERROR`: Erreur inconnue

### Exemples de réponses d'erreur

#### 400 - Requête invalide
```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Le format de l'email est invalide",
    "details": [
      {
        "field": "email",
        "reason": "doit être une adresse email valide"
      }
    ]
  }
}
```

#### 401 - Non authentifié
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou mot de passe incorrect",
    "details": []
  }
}
```

#### 403 - Non autorisé
```json
{
  "error": {
    "code": "FORBIDDEN_ACTION",
    "message": "Vous n'êtes pas autorisé à effectuer cette action",
    "details": [
      {
        "field": "permissions",
        "reason": "niveau d'autorisation insuffisant"
      }
    ]
  }
}
```

#### 404 - Ressource non trouvée
```json
{
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "L'offre d'emploi demandée n'existe pas",
    "details": [
      {
        "field": "id",
        "reason": "aucune offre trouvée avec cet identifiant"
      }
    ]
  }
}
```

#### 500 - Erreur serveur
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Une erreur inattendue s'est produite",
    "details": []
  }
}
```

## Types de données

### User

## Exemples d'utilisation

### Authentification

#### Inscription d'un nouvel utilisateur
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

### Gestion des offres d'emploi

#### Recherche d'offres
```bash
curl -X GET "http://localhost:3000/api/jobs?keywords[]=react&keywords[]=typescript&location=paris&jobType[]=full-time&salary[min]=40000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Création d'une offre
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Développeur React Senior",
    "company": "TechCorp",
    "location": "Paris",
    "description": "Nous recherchons un développeur React expérimenté...",
    "url": "https://example.com/job/123",
    "salary": {
      "min": 50000,
      "max": 70000,
      "currency": "EUR"
    },
    "jobType": "full-time",
    "experienceLevel": "senior",
    "skills": ["react", "typescript", "redux"]
  }'
```

### Gestion des documents

#### Récupération des documents
```bash
curl -X GET "http://localhost:3000/api/documents?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Création d'un document
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon CV",
    "type": "cv",
    "content": "Contenu du CV...",
    "metadata": {
      "template": "modern",
      "version": "1.0"
    }
  }'
```

### Gestion du Kanban

#### Récupération du tableau
```bash
curl -X GET http://localhost:3000/api/kanban \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Création d'un tableau
```bash
curl -X POST http://localhost:3000/api/kanban \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Processus de recrutement",
    "columns": [
      {
        "title": "À postuler",
        "cards": []
      },
      {
        "title": "En cours",
        "cards": []
      },
      {
        "title": "Entretiens",
        "cards": []
      },
      {
        "title": "Offres",
        "cards": []
      }
    ]
  }'
```

### Exemples avec JavaScript/TypeScript

#### Authentification
```typescript
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Échec de la connexion');
  }
  
  return response.json();
}
```

#### Recherche d'offres
```typescript
async function searchJobs(criteria: SearchCriteria) {
  const queryParams = new URLSearchParams();
  
  if (criteria.keywords) {
    criteria.keywords.forEach(keyword => {
      queryParams.append('keywords[]', keyword);
    });
  }
  
  if (criteria.location) {
    queryParams.append('location', criteria.location);
  }
  
  const response = await fetch(`http://localhost:3000/api/jobs?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Échec de la recherche');
  }
  
  return response.json();
}
```

#### Gestion des erreurs
```typescript
async function handleApiError(response: Response) {
  if (!response.ok) {
    const error = await response.json();
    switch (error.error.code) {
      case 'INVALID_CREDENTIALS':
        throw new Error('Identifiants invalides');
      case 'FORBIDDEN_ACTION':
        throw new Error('Action non autorisée');
      case 'RESOURCE_NOT_FOUND':
        throw new Error('Ressource non trouvée');
      default:
        throw new Error('Une erreur est survenue');
    }
  }
}
```