import { Id } from '../core/id';
import { ISODateString } from '../core/date';
import { Result } from '../core/error';

/**
 * Type représentant le statut d'une candidature
 */
export type ApplicationStatus = 
  | 'saved' 
  | 'applied' 
  | 'interview' 
  | 'offer' 
  | 'rejected';

/**
 * Type représentant une candidature
 */
export interface Application {
  id: Id;
  jobId: Id;
  userId: Id;
  status: ApplicationStatus;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Type représentant une requête de création de candidature
 */
export interface CreateApplicationRequest {
  jobId: Id;
  status: ApplicationStatus;
  notes?: string;
}

/**
 * Type représentant une requête de mise à jour de candidature
 */
export interface UpdateApplicationRequest {
  status?: ApplicationStatus;
  notes?: string;
}

/**
 * Type représentant le résultat d'une opération sur une candidature
 */
export type ApplicationResult = Result<Application>;

/**
 * Type représentant le résultat d'une liste de candidatures
 */
export type ApplicationListResult = Result<Application[]>; 