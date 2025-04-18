export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead'
}

export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship'
}

export enum CommuteMode {
  WALKING = 'walking',
  BIKING = 'biking',
  DRIVING = 'driving',
  TRANSIT = 'transit'
}

export enum ApplicationStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected'
}

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
  source: string;
}

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
} 