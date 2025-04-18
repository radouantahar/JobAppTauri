/**
 * Types liés aux offres d'emploi
 */

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
  id: string;
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
} 