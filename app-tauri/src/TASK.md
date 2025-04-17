# Tâches

## En cours

### Refactoring des types Document
- [ ] Résoudre le conflit entre les types dans `types.ts` et `types/index.ts`
  - Problème : Deux définitions différentes du type `Document` et `DocumentType`
  - Solution proposée : Unifier les types dans un seul fichier
  - Impact : Mise à jour nécessaire de tous les composants utilisant ces types
  - Date : 2024-04-16

#### Sous-tâches
1. [ ] Décider quelle définition conserver (probablement celle de `types/index.ts`)
2. [ ] Supprimer les types dupliqués de `types.ts`
3. [ ] Mettre à jour tous les composants pour utiliser les types unifiés
4. [ ] Mettre à jour les tests
5. [ ] Vérifier la compatibilité avec la base de données

## Terminé

### Migration des types Document
- [x] Créer un plan de migration
- [x] Documenter les changements nécessaires
- [x] Créer une branche pour la migration
- [x] Commencer la mise à jour des types 