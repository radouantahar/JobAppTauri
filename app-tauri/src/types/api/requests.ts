import { Id } from '../core/id';
import { Job, CreateJobRequest, UpdateJobRequest } from '../models/job';

/**
 * Type représentant une requête d'authentification
 */
export interface AuthRequest {
  email: string;
  password: string;
}

/**
 * Type représentant une requête de recherche d'emploi
 */
export interface SearchJobsRequest {
  query?: string;
  location?: string;
  type?: Job['type'];
  experienceLevel?: Job['experienceLevel'];
  remote?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Type représentant une requête de mise à jour de statut
 */
export interface UpdateStatusRequest {
  id: Id;
  status: string;
}

/**
 * Type représentant une requête de téléchargement de document
 */
export interface UploadDocumentRequest {
  file: File;
  type: string;
  jobId?: Id;
} 