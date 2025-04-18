# Guide d'Utilisation

## Installation

### Prérequis
- Windows 10/11, macOS 10.15+, ou Linux
- Python 3.10+
- Node.js 18+
- Rust 1.70+
- Docker et Docker Compose

### Étapes d'Installation
1. Cloner le dépôt
```bash
git clone https://github.com/radouantahar/JobAppTauri.git
cd JobAppTauri
```

2. Installer les dépendances
```bash
# Python
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` sous Windows
pip install -r requirements.txt

# Node.js
cd app-tauri
npm install

# Rust
rustup update
cargo install tauri-cli
```

3. Lancer les services
```bash
docker-compose up -d
```

## Configuration Initiale

### Profil Utilisateur
1. Créer un compte
2. Configurer les préférences
3. Importer le CV
4. Définir les critères de recherche

### Exemple de Configuration
```typescript
const userPreferences = {
  jobTypes: ['CDI', 'CDD'],
  locations: ['Paris', 'Lyon'],
  salaryRange: {
    min: 40000,
    max: 60000,
    currency: 'EUR'
  },
  skills: ['React', 'TypeScript', 'Python'],
  remote: true
};
```

## Utilisation de l'Application

### Recherche d'Emploi
1. Configurer les filtres
2. Lancer la recherche
3. Analyser les résultats
4. Sauvegarder les offres

### Exemple de Recherche
```typescript
const searchFilters = {
  keywords: 'React Developer',
  location: 'Paris',
  radius: 20,
  experience: 'mid',
  postedSince: '7d'
};

const results = await searchJobs(searchFilters);
```

### Gestion des Candidatures
1. Visualiser le tableau Kanban
2. Déplacer les offres
3. Générer les documents
4. Suivre les réponses

### Exemple de Candidature
```typescript
const application = {
  jobId: '123',
  status: 'applied',
  documents: {
    cv: 'cv.pdf',
    coverLetter: 'cover_letter.pdf'
  },
  notes: 'Entretien prévu le 15/04'
};

await updateApplication(application);
```

## Fonctionnalités Avancées

### Analyse des Temps de Trajet
1. Configurer les adresses
2. Calculer les trajets
3. Analyser les résultats
4. Optimiser les choix

### Exemple de Calcul
```typescript
const commute = {
  home: '123 Rue Example, Paris',
  work: '456 Avenue Test, Paris',
  transport: 'public'
};

const time = await calculateCommuteTime(commute);
```

### Génération de Documents
1. Sélectionner le template
2. Personnaliser le contenu
3. Générer le document
4. Sauvegarder le résultat

### Exemple de Génération
```typescript
const document = {
  type: 'cover_letter',
  template: 'modern',
  content: {
    company: 'Example Corp',
    position: 'React Developer',
    skills: ['React', 'TypeScript']
  }
};

const file = await generateDocument(document);
```

## Dépannage

### Problèmes Courants
- Erreurs de connexion
- Problèmes de performance
- Erreurs de génération
- Problèmes de synchronisation

### Solutions
1. Vérifier les logs
2. Redémarrer l'application
3. Vérifier la connexion
4. Mettre à jour les dépendances

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

## Utilisation de la Base de Données

### Connexion à la Base de Données
```typescript
// La connexion est gérée automatiquement par tauri-plugin-sql
// Aucune configuration manuelle n'est nécessaire
```

### Exécution de Requêtes
```typescript
// Exemple de requête simple
const results = await invoke('query', {
  sql: 'SELECT * FROM users WHERE email = ?',
  params: ['user@example.com']
});

// Exemple de transaction
const result = await invoke('transaction', {
  operations: [
    {
      sql: 'INSERT INTO applications (user_id, job_id) VALUES (?, ?)',
      params: [userId, jobId]
    },
    {
      sql: 'UPDATE jobs SET status = ? WHERE id = ?',
      params: ['APPLIED', jobId]
    }
  ]
});
```

## Gestion des Documents

1. **Création d'un Document**
   ```typescript
   const document = await invoke('create_document', {
     name: 'Mon CV',
     content: 'Contenu du CV...',
     document_type: 'CV'
   });
   ```

2. **Recherche de Documents**
   ```typescript
   const documents = await invoke('find_documents', {
     filters: {
       type: 'CV',
       date_from: '2024-01-01'
     }
   });
   ```

## Gestion des Candidatures

1. **Création d'une Candidature**
   ```typescript
   const application = await invoke('create_application', {
     job_id: '123e4567-e89b-12d3-a456-426614174000',
     documents: ['cv_id', 'lettre_id'],
     notes: 'Notes importantes...'
   });
   ```

2. **Suivi des Candidatures**
   ```typescript
   const applications = await invoke('get_applications', {
     status: 'EN_COURS',
     date_from: '2024-01-01'
   });
   ```

## Optimisation des Performances

1. **Utilisation du Cache**
   ```typescript
   // Les requêtes fréquentes sont automatiquement mises en cache
   const jobs = await invoke('get_cached_jobs', {
     cache_key: 'recent_jobs'
   });
   ```

2. **Indexation**
   ```typescript
   // Les index sont créés automatiquement au démarrage
   await invoke('create_indexes');
   ```

## Gestion des Erreurs

```typescript
try {
  const result = await invoke('some_command');
} catch (error) {
  console.error('Erreur:', error.message);
  // Gérer l'erreur selon son type
  if (error.code === 'Database') {
    // Erreur de base de données
  } else if (error.code === 'Validation') {
    // Erreur de validation
  }
}
```

## Bonnes Pratiques

1. **Transactions**
   - Utiliser les transactions pour les opérations multiples
   - S'assurer de la cohérence des données

2. **Requêtes**
   - Utiliser des paramètres pour éviter les injections SQL
   - Limiter le nombre de résultats avec `LIMIT`
   - Utiliser les index appropriés

3. **Cache**
   - Mettre en cache les données fréquemment utilisées
   - Invalider le cache lors des modifications

4. **Sécurité**
   - Ne jamais exposer les requêtes SQL directement
   - Valider toutes les entrées utilisateur
   - Utiliser les transactions pour les opérations critiques

5. **Monitoring**
   - Surveiller les performances des requêtes
   - Analyser les logs d'erreur
   - Optimiser les requêtes lentes

6. **Backup**
   - Effectuer des backups réguliers
   - Tester les procédures de restauration
   - Stocker les backups en lieu sûr 