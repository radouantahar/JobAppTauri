# Migration des Types Document

## Problème
Nous avons actuellement deux définitions différentes du type `Document` et `DocumentType` :

1. Dans `types.ts` :
```typescript
export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  size: number;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  description?: string;
}

export type DocumentType = 'CV' | 'LETTER' | 'OTHER';
```

2. Dans `types/index.ts` :
```typescript
export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  content: string;
  url: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DocumentType = 'cv' | 'cover-letter' | 'portfolio' | 'other';
```

## Solution Proposée

Nous devrions unifier ces types en une seule définition cohérente :

```typescript
export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  description?: string;
  content: string;
  size: number;
  url?: string;
  filePath?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DocumentType = 'CV' | 'COVER_LETTER' | 'PORTFOLIO' | 'OTHER';
```

## Plan de Migration

1. Créer une nouvelle branche pour la migration
2. Mettre à jour le type dans `types/index.ts`
3. Supprimer les définitions dans `types.ts`
4. Mettre à jour tous les composants qui utilisent ces types
5. Mettre à jour les tests
6. Mettre à jour la base de données si nécessaire

## Impact

Cette migration affectera les composants suivants :
- DocumentForm
- DocumentList
- DocumentManager
- DocumentModal
- Et potentiellement d'autres composants qui utilisent ces types

## Tâches

1. [ ] Créer une nouvelle branche `refactor/document-types`
2. [ ] Mettre à jour les types dans `types/index.ts`
3. [ ] Supprimer les types dupliqués de `types.ts`
4. [ ] Mettre à jour le composant `DocumentForm`
5. [ ] Mettre à jour les tests du composant `DocumentForm`
6. [ ] Mettre à jour les autres composants affectés
7. [ ] Mettre à jour la base de données si nécessaire
8. [ ] Tester toutes les fonctionnalités
9. [ ] Créer une PR pour review 