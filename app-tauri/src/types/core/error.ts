/**
 * Type représentant une erreur d'application
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Type représentant le résultat d'une opération
 * Peut être un succès (T) ou une erreur (AppError)
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: AppError };

/**
 * Crée un résultat de succès
 * @param data Les données du succès
 * @returns Un Result avec success: true
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Crée un résultat d'erreur
 * @param code Le code d'erreur
 * @param message Le message d'erreur
 * @param details Les détails optionnels
 * @returns Un Result avec success: false
 */
export function error(code: string, message: string, details?: unknown): Result<never> {
  return { 
    success: false, 
    error: { code, message, details } 
  };
} 