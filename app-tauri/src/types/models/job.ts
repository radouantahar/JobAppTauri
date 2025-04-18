import { Id } from '../core/id';
import { ISODateString } from '../core/date';
import { Result } from '../core/error';

export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'other';
export type JobType = 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type CommuteMode = 'driving' | 'transit' | 'walking' | 'bicycling';

export interface Salary {
  min: number;
  max: number;
  currency: string;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface CommuteTime {
  mode: CommuteMode;
  duration: number;
  distance: number;
}

export interface Job {
  id: Id;
  title: string;
  company: string;
  location: string;
  type: JobType;
  postedAt: ISODateString;
  experienceLevel: ExperienceLevel;
  salary: Salary;
  description: string;
  url: string;
  remote: boolean;
  skills: string[];
  jobType: JobType;
  commuteTimes: CommuteTime[];
  source: JobSource;
}

/**
 * Type représentant une requête de création de job
 */
export interface CreateJobRequest {
  title: string;
  company: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  salary: Salary;
  description: string;
  url: string;
  remote: boolean;
  skills: string[];
  jobType: JobType;
  commuteTimes: CommuteTime[];
  source: JobSource;
}

/**
 * Type représentant une requête de mise à jour de job
 */
export interface UpdateJobRequest {
  title?: string;
  company?: string;
  location?: string;
  type?: JobType;
  experienceLevel?: ExperienceLevel;
  salary?: Salary;
  description?: string;
  url?: string;
  remote?: boolean;
  skills?: string[];
  jobType?: JobType;
  commuteTimes?: CommuteTime[];
  source?: JobSource;
}

/**
 * Type représentant le résultat d'une opération sur un job
 */
export type JobResult = Result<Job>;

/**
 * Type représentant le résultat d'une liste de jobs
 */
export type JobListResult = Result<Job[]>; 