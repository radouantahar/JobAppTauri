# Exemples d'Utilisation

Ce document fournit des exemples pratiques d'utilisation des différentes fonctionnalités de l'application.

## Authentification

### Inscription d'un Utilisateur
```typescript
// Frontend
const registerUser = async () => {
  try {
    const user = await invoke('register', {
      email: 'user@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    });
    console.log('Utilisateur créé:', user);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
  }
};
```

### Connexion
```typescript
// Frontend
const login = async () => {
  try {
    const user = await invoke('login', {
      email: 'user@example.com',
      password: 'securePassword123'
    });
    console.log('Utilisateur connecté:', user);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
  }
};
```

## Gestion des Documents

### Création d'un Document
```typescript
// Frontend
const createDocument = async () => {
  try {
    const document = await invoke('create_document', {
      userId: 'user-uuid',
      type: 'CV',
      content: 'Contenu du CV...',
      metadata: {
        title: 'Mon CV',
        version: '1.0'
      }
    });
    console.log('Document créé:', document);
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
  }
};
```

### Recherche de Documents
```typescript
// Frontend
const searchDocuments = async () => {
  try {
    const documents = await invoke('search_documents', {
      userId: 'user-uuid',
      type: 'CV'
    });
    console.log('Documents trouvés:', documents);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
  }
};
```

## Gestion des Candidatures

### Création d'une Candidature
```typescript
// Frontend
const createApplication = async () => {
  try {
    const application = await invoke('create_application', {
      userId: 'user-uuid',
      company: 'Entreprise XYZ',
      position: 'Développeur Full Stack',
      status: 'EN_COURS',
      documents: ['cv-uuid', 'lettre-uuid']
    });
    console.log('Candidature créée:', application);
  } catch (error) {
    console.error('Erreur lors de la création:', error);
  }
};
```

### Suivi des Candidatures
```typescript
// Frontend
const trackApplications = async () => {
  try {
    const applications = await invoke('get_applications', {
      userId: 'user-uuid',
      status: 'EN_COURS'
    });
    console.log('Candidatures en cours:', applications);
  } catch (error) {
    console.error('Erreur lors du suivi:', error);
  }
};
```

## Transactions et Gestion des Erreurs

### Transaction Atomique
```rust
// Backend
#[tauri::command]
async fn create_application_with_documents(
    application: Application,
    documents: Vec<Document>,
    pool: State<'_, SqlitePool>,
) -> Result<Application, String> {
    pool.transaction(|tx| async move {
        // Créer les documents
        for doc in documents {
            doc.create(&tx).await?;
        }
        
        // Créer la candidature
        application.create(&tx).await?;
        
        Ok(application)
    }).await
}
```

### Gestion des Erreurs
```typescript
// Frontend
const handleError = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Erreur de base de données:', error.message);
      // Gérer spécifiquement les erreurs de base de données
    } else if (error instanceof ValidationError) {
      console.error('Erreur de validation:', error.message);
      // Gérer les erreurs de validation
    } else {
      console.error('Erreur inattendue:', error);
      // Gérer les erreurs générales
    }
    throw error;
  }
};
```

## Optimisation des Performances

### Chargement Paresseux
```typescript
// Frontend
const loadApplications = async (page: number, pageSize: number) => {
  try {
    const applications = await invoke('get_applications_paginated', {
      userId: 'user-uuid',
      page,
      pageSize
    });
    return applications;
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    throw error;
  }
};
```

### Mise en Cache
```rust
// Backend
#[tauri::command]
async fn get_cached_user(
    user_id: Uuid,
    pool: State<'_, SqlitePool>,
) -> Result<User, String> {
    // Vérifier le cache
    if let Some(cached_user) = cache.get(&user_id) {
        return Ok(cached_user);
    }
    
    // Charger depuis la base de données
    let user = User::find_by_id(&pool, user_id).await?;
    
    // Mettre en cache
    cache.set(user_id, user.clone());
    
    Ok(user)
}
```

## Tests

### Test d'Intégration
```rust
#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_application_workflow() {
        let pool = setup_test_db().await;
        
        // Créer un utilisateur
        let user = create_test_user(&pool).await;
        
        // Créer des documents
        let documents = create_test_documents(&pool, &user.id).await;
        
        // Créer une candidature
        let application = create_test_application(
            &pool,
            &user.id,
            &documents
        ).await;
        
        // Vérifier les résultats
        assert_eq!(application.user_id, user.id);
        assert_eq!(application.status, "EN_COURS");
    }
}
```

## Bonnes Pratiques

1. **Validation des Données**
   - Toujours valider les entrées côté client et serveur
   - Utiliser des schémas de validation cohérents

2. **Gestion des Erreurs**
   - Fournir des messages d'erreur clairs et utiles
   - Logger les erreurs pour le débogage

3. **Sécurité**
   - Ne jamais stocker les mots de passe en clair
   - Utiliser des tokens JWT pour l'authentification
   - Valider les permissions à chaque requête

4. **Performance**
   - Utiliser le chargement paresseux pour les grandes listes
   - Mettre en cache les données fréquemment utilisées
   - Optimiser les requêtes SQL avec des index appropriés 