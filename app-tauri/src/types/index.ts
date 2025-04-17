/**
 * Main types file that re-exports all type definitions
 */

// Core types
export * from './core';

// Document types
export * from './documents';

// Statistics types
export * from './statistics';

// Job types
export * from './job';

// User types
export * from './user';

// Kanban types
export * from './kanban';

// Search types
export * from './search';

// LLM types
export * from './llm';

// Enums and literals
export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'other';
export type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
export type CommuteMode = 'driving' | 'transit' | 'walking' | 'bicycling';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type RemotePreference = 'office' | 'hybrid' | 'remote';
export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF';
export type SalaryPeriod = 'hour' | 'week' | 'month' | 'year';
export type Language = 'fr' | 'en' | 'de';

// Interfaces
export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface CommuteLocation {
  duration: number;
  distance: number;
  mode: CommuteMode;
  coordinates?: Coordinates;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface Application {
  id: string;
  jobId: string;
  status: JobStatus;
  company: string;
  position: string;
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  nextStep?: string;
  documents?: {
    type: DocumentType;
    path: string;
  }[];
  interviews?: {
    date: string;
    type: InterviewType;
    notes?: string;
    contactPerson?: string;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
  cv?: string;
  preferredJobTypes?: string[];
  preferredLocations?: string[];
  experienceLevel?: string;
  salaryExpectation?: number;
  availability?: string;
  noticePeriod?: number;
}

export interface CommuteTime {
  duration: number;
  distance: number;
  mode: CommuteMode;
}

export interface SearchFilters {
  keywords: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTypes: string[];
  experienceLevels: string[];
  remote: boolean | null | undefined;
  skills: string[];
  datePosted: Date | null;
  sortBy: 'relevance' | 'date' | 'salary';
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  searchQuery: string;
  filters: SearchFilters;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
}

import { ISODateString } from './core';

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  status: string;
  updatedAt: ISODateString;
  notes?: string;
  interviews?: {
    date: ISODateString;
    type: InterviewType;
    notes?: string;
    contactPerson?: string;
    outcome?: 'positive' | 'negative' | 'pending';
  }[];
  createdAt: ISODateString;
}

import { ApplicationStatus } from './core';

export interface CoreApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byMonth: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
}

export type { ApplicationStats } from './statistics';