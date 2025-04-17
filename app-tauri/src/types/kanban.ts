import { Job } from './job';
import { Interview } from './interview';
import { ISODateString } from './core';

/**
 * Interface pour une carte Kanban
 */
export interface KanbanCard extends Job {
  /** Identifiant unique de la carte */
  id: string;
  /** ID du job associé */
  jobId: string;
  /** Statut de la carte */
  status: 'todo' | 'in-progress' | 'done';
  /** Date de création */
  createdAt: ISODateString;
  /** Date de dernière mise à jour */
  updatedAt: ISODateString;
  /** Notes optionnelles */
  notes?: string;
  /** Liste des entretiens */
  interviews?: Interview[];
}

export interface KanbanColumn {
  id: number;
  title: string;
  description?: string;
  order: number;
  jobs: Job[];
  color?: string;
  icon?: string;
  limit?: number;
  createdAt: string;
  updatedAt: string;
} 