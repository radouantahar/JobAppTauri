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