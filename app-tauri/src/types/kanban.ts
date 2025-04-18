import type { ISODateString } from './core/date';
import type { JobType, ExperienceLevel, JobSource, Salary, CommuteTime } from './job';

/**
 * Interface pour une carte Kanban
 */
export interface Interview {
  date: ISODateString;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  notes?: string;
  contactPerson?: string;
  outcome?: 'positive' | 'negative' | 'neutral' | 'pending';
}

export interface KanbanCard {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  postedAt: string;
  experienceLevel: ExperienceLevel;
  salary: Salary;
  description: string;
  url: string;
  remote: boolean;
  skills: string[];
  jobType: JobType;
  commuteTimes: CommuteTime[];
  source: JobSource;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: ISODateString;
  updatedAt: ISODateString;
  notes?: string;
  interviews?: Interview[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
} 