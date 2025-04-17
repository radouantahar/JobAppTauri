/**
 * Core types used throughout the application
 */

/**
 * Type-safe ISO date string with brand type
 * @example "2024-04-17T12:00:00.000Z"
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

/**
 * Creates a type-safe ISO date string
 * @param date - ISO date string to validate
 * @returns Type-safe ISO date string
 * @throws Error if the date string is invalid
 */
export function createISODateString(date: string): ISODateString {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(date)) {
    throw new Error('Invalid ISO date string format');
  }
  return date as ISODateString;
}

/**
 * Unique identifier for a job
 */
export type JobID = string;

/**
 * Unique identifier for a user
 */
export type UserID = string;

/**
 * Generic response type for API calls
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Generic error type for API calls
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * État d'une candidature
 */
export type ApplicationStatus = 
  | 'favorite'    // Offre en favoris
  | 'applied'     // Candidature envoyée
  | 'interview'   // Entretien programmé
  | 'offer'       // Offre reçue
  | 'rejected'    // Candidature refusée
  | 'archived';   // Candidature archivée

/**
 * Informations sur une candidature
 */
export interface Application {
  id: string;
  jobId: JobID;
  userId: UserID;
  status: ApplicationStatus;
  appliedAt: ISODateString;
  updatedAt: ISODateString;
  notes?: string;
  interviewDate?: ISODateString;
  offerDetails?: {
    salary?: number;
    startDate?: ISODateString;
    benefits?: string[];
  };
}

/**
 * Statistiques de candidatures
 */
export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byMonth: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
}

/**
 * Filtres pour les candidatures
 */
export interface ApplicationFilters {
  status?: ApplicationStatus[];
  dateRange?: {
    start: ISODateString;
    end: ISODateString;
  };
  search?: string;
} 