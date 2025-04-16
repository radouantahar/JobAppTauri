# Règles de Développement

## 🧪 Tests

### 1. Structure des Tests
- Tous les tests doivent être dans des dossiers `__tests__`
- Utiliser des fixtures pour les données mockées
- Créer des helpers de test pour les objets complexes

### 2. Fixtures de Test
```typescript
// Exemple de fixture pour Job
import type { Job, ISODateString, JobType, CommuteTime } from '../../types';

const createISODateString = (date: Date): ISODateString => {
  return date.toISOString() as ISODateString;
};

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Test Job',
  company: 'Test Company',
  location: 'Paris',
  type: 'CDI',
  postedAt: createISODateString(new Date()),
  experience: 'mid',
  salary: {
    min: 40000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  description: 'Test description',
  url: 'https://example.com',
  remote: false,
  skills: ['React', 'TypeScript'],
  jobType: 'CDI' as JobType,
  experienceLevel: 'mid',
  commuteTimes: [] as CommuteTime[],
  source: 'linkedin',
  ...overrides
});
```

### 3. Props de Test
```typescript
// Exemple de fixture pour les props
export const createMockProps = (overrides: Partial<ComponentProps> = {}): ComponentProps => ({
  onSubmit: vi.fn(),
  isLoading: false,
  ...overrides
});
```

## 🔧 TypeScript

### 1. Types Stricts
- Toujours définir des types stricts
- Utiliser des types utilitaires pour les props optionnelles
- Éviter les `any`
- Utiliser des types personnalisés pour les chaînes ISO (ex: `ISODateString`)

### 2. Gestion des Erreurs
```typescript
// Standard pour la gestion des erreurs
type ErrorMessage = string | React.ReactNode;

const ErrorDisplay: React.FC<{ error: ErrorMessage }> = ({ error }) => (
  <Alert color="red">
    {typeof error === 'string' ? error : error.message}
  </Alert>
);
```

### 3. Imports
- Utiliser le nouveau format JSX sans import React
- Importer uniquement ce qui est nécessaire
- Utiliser des imports nommés pour les composants
- Utiliser des imports de type explicites avec `import type`

## 📦 Structure des Fichiers

### 1. Organisation
```
src/
  components/
    __tests__/
      fixtures/
        job.ts
        props.ts
      Component.test.tsx
    Component.tsx
  types/
    index.ts
  hooks/
    __tests__/
      useHook.test.tsx
    useHook.ts
```

### 2. Conventions de Nommage
- Types : PascalCase
- Variables : camelCase
- Constantes : UPPER_SNAKE_CASE
- Fichiers de test : Component.test.tsx
- Fichiers de fixtures : fixtureName.ts
- Hooks : useHookName.ts

## 🔄 Workflow de Développement

### 1. Avant de Commencer
- Vérifier les types existants
- Créer les fixtures nécessaires
- Mettre à jour les tests existants
- Vérifier les règles de développement

### 2. Pendant le Développement
- Exécuter les tests fréquemment
- Vérifier les erreurs TypeScript
- Maintenir la cohérence des types
- Suivre les conventions de nommage

### 3. Avant le Commit
- Exécuter tous les tests
- Vérifier les erreurs de type
- Nettoyer les imports inutilisés
- Vérifier la conformité avec les règles

## 🛠 Outils Recommandés

### 1. Extensions VS Code
- ESLint
- Prettier
- TypeScript Vue Plugin
- Error Lens

### 2. Scripts NPM
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
``` 