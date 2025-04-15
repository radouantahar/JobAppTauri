/**
 * Base types for the application with enhanced type safety
 */

// ==================== Core Types ====================
export type ISODateString = string & { readonly __brand: 'ISODateString' };
export type JobID = string;
export type UserID = string;

// ==================== Enums and Literals ====================
export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'other';
export type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
export type CommuteMode = 'driving' | 'transit' | 'walking' | 'bicycling';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type RemotePreference = 'office' | 'hybrid' | 'remote';
export type DocumentType = 'cv' | 'cover-letter' | 'portfolio' | 'other';
export const DOCUMENT_TYPES: DocumentType[] = ['cv', 'cover-letter', 'portfolio', 'other'];
export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF';
export type SalaryPeriod = 'hour' | 'week' | 'month' | 'year';
export type Language = 'fr' | 'en' | 'de';

// ==================== Interfaces ====================

/** Geographic coordinates with latitude and longitude */
export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

/** Commute information including duration, distance, and mode */
export interface CommuteLocation {
  duration: number; // in minutes
  distance: number; // in km
  mode: CommuteMode;
  coordinates?: Coordinates;
}

/** Salary range with optional min/max and currency/period */
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: string;
}

/** Education history entry */
export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

/** CV/resume information */
export interface CVInfo {
  path: string;
  lastUpdated: string;
  skills?: string[];
  experienceYears?: number;
  education?: Education[];
  certifications?: string[];
}

/** Job posting information */
export interface Job {
  id: JobID;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: JobSource;
  publishedAt: ISODateString;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salary: SalaryRange;
  matchingScore: number;
  skills: string[];
  commuteTimes: Record<string, CommuteTime>;
}

/** Application tracking information */
export interface Application {
  id: string;
  jobId: string;
  status: 'in_progress' | 'interview' | 'offer' | 'rejected';
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

/** Job search criteria */
export interface SearchCriteria {
  query?: string;
  page?: number;
  location?: string;
  jobType?: JobType[];
  experienceLevel?: ExperienceLevel[];
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  remote?: boolean;
}

/** User profile information */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  cv: string;
  preferredJobTypes: string[];
  preferredLocations: string[];
  experienceLevel: string;
  salaryExpectation: number;
  availability: string;
  noticePeriod: number;
}

/** Kanban card representing a job application */
export interface KanbanCard {
  id: string;
  jobId: string;
  title: string;
  description: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  interviews?: Array<{
    date: string;
    type: string;
    notes?: string;
  }>;
}

/** Interview details */
export interface Interview {
  date: ISODateString;
  type: InterviewType;
  notes?: string;
  outcome?: 'pending' | 'positive' | 'negative';
}

/** Kanban column containing cards */
export interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  cards: KanbanCard[];
  color?: string; // hex color
  limit?: number;
}

/** Weighted keyword for search */
export interface KeywordWeight {
  keyword: string;
  weight: number; // 1-10 scale
  required?: boolean;
}

/** Search category with weighted keywords */
export interface SearchCategory {
  id: number;
  name: string;
  keywords: KeywordWeight[];
  priority?: number; // 1-10 scale
}

/** Saved search preference */
export interface SearchPreference {
  id: number;
  name: string;
  isActive: boolean;
  categories: SearchCategory[];
  lastUsed?: ISODateString;
}

/** LLM model information */
export interface LLMModel {
  name: string;
  maxTokens: number;
  supportsJson?: boolean;
  isFineTuned?: boolean;
}

/** LLM provider information */
export interface LLMProvider {
  id: number;
  name: string;
  type: 'local' | 'openai' | 'mistral' | 'anthropic' | 'groq' | 'custom';
  isActive: boolean;
  priority: number; // 1-10 scale
  models: LLMModel[];
  costPer1kTokens: number;
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: number; // requests per minute
}

/** Document template structure */
export interface DocumentTemplate {
  id: number;
  name: string;
  type: DocumentType;
  content: string;
  variables?: string[];
  isDefault?: boolean;
  language?: Language;
}

/** Generated document record */
export interface GeneratedDocument {
  id: number;
  jobId: JobID;
  templateId: number;
  type: DocumentType;
  content: string;
  createdAt: ISODateString;
  version?: number;
  feedback?: {
    rating?: number; // 1-5 scale
    comments?: string;
  };
}

/** Application state */
export interface AppState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  loading: boolean;
  error: Error | null;
  setUser: (user: AppState['user']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

/** Standard API response format */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/** Job statistics */
export interface JobStats {
  totalJobs: number;
  trendData: {
    labels: string[];
    values: number[];
  };
  sourceDistribution: {
    labels: string[];
    values: number[];
  };
}

/** Application statistics */
export interface ApplicationStats {
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  successRate: number;
}

/** Document generation request */
export interface DocumentGenerationRequest {
  jobId: JobID;
  templateId: number;
  type: DocumentType;
  variables?: Record<string, string>;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  content?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
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