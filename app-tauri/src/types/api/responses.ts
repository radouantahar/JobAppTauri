import { Id } from '../core/id';
import { Job } from '../models/job';
import { Result } from '../core/error';

/**
 * Type représentant une réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type représentant une réponse de recherche d'emploi
 */
export type SearchJobsResponse = PaginatedResponse<Job>;

/**
 * Type représentant une réponse de document
 */
export interface DocumentResponse {
  id: Id;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant une réponse de statistiques
 */
export interface StatsResponse {
  totalJobs: number;
  totalApplications: number;
  totalDocuments: number;
  jobsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
} 