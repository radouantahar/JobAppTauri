/**
 * Types liés aux offres d'emploi
 */

export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'other';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type CommuteMode = 'driving' | 'transit' | 'walking' | 'bicycling';

export interface CommuteTime {
  duration: number;
  distance: number;
  mode: CommuteMode;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  url: string;
  description?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  publishedAt: string;
  postedAt?: string;
  skills?: string[];
  remote?: boolean;
  source?: JobSource;
  matchingScore?: number;
  commuteTimes?: CommuteTime[];
  contractType?: string;
  createdAt?: string;
} 