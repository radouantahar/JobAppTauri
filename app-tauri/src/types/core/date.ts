/**
 * Type représentant une date ISO
 * Utilisé pour les champs de date dans les modèles
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

/**
 * Fonction de validation d'une date ISO
 * @param date La date à valider
 * @returns true si la date est valide
 */
export function isValidISODate(date: ISODateString): boolean {
  try {
    return !isNaN(new Date(date).getTime());
  } catch {
    return false;
  }
}

/**
 * Convertit une Date en ISODateString
 * @param date La date à convertir
 * @returns La date au format ISODateString
 */
export function toISODateString(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
} 