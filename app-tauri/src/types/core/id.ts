/**
 * Type représentant un identifiant unique
 * Utilisé pour les IDs de base de données et les références
 */
export type Id = string;

/**
 * Fonction de validation d'un Id
 * @param id L'identifiant à valider
 * @returns true si l'id est valide
 */
export function isValidId(id: Id): boolean {
  return typeof id === 'string' && id.length > 0;
} 