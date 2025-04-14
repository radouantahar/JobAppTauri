/**
 * Base types for the application with enhanced type safety
 */

// ==================== Core Types ====================
export type ISODateString = string & { readonly __brand: 'ISODateString' };
export type JobID = number & { readonly __brand: 'JobID' };
export type UserID = number & { readonly __brand: 'UserID' };

// ==================== Enums and Literals ====================
export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'monster' | 'custom';
export type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
export type CommuteMode = 'driving' | 'transit' | 'walking' | 'bicycling';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type RemotePreference = 'office' | 'hybrid' | 'remote';
export type DocumentType = 'cv' | 'coverLetter' | 'email' | 'followUp';
export const DOCUMENT_TYPES: DocumentType[] = ['cv', 'coverLetter', 'email', 'followUp'];
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
  min?: number;
  max?: number;
  currency?: Currency;
  period?: SalaryPeriod;
  /** @assertion min <= max when both present */
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
  salary?: SalaryRange;
  matchingScore: number; // 0-1 scale
  commuteTimes: {
    primaryHome: CommuteLocation;
    secondaryHome?: CommuteLocation;
  };
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  appliedAt?: ISODateString;
  status?: JobStatus;
}

/** Job search criteria */
export interface SearchCriteria {
  keywords: string[];
  location?: string;
  radius?: number; // in km
  jobType?: JobType[];
  datePosted?: '24h' | 'week' | 'last_week' | 'month' | 'any';
  salary?: SalaryRange;
  commuteTime?: {
    max: number; // max minutes
    from: 'primary' | 'secondary' | 'both';
    mode?: CommuteMode;
  };
  experienceLevel?: ExperienceLevel[];
  remoteOnly?: boolean;
}

/** User profile information */
export interface UserProfile {
  id: UserID;
  name: string;
  email: string;
  phone?: string;
  locations: {
    primary: string;
    secondary?: string;
    coordinates?: {
      primary: Coordinates;
      secondary?: Coordinates;
    };
  };
  cv: CVInfo;
  preferences?: {
    notifications?: boolean;
    darkMode?: boolean;
    language?: Language;
    commuteMode?: CommuteMode;
  };
  jobPreferences?: {
    minSalary?: number;
    preferredJobTypes?: JobType[];
    remotePreference?: RemotePreference;
  };
}

/** Kanban card representing a job application */
export interface KanbanCard {
  id: number;
  jobId: JobID;
  columnId: number;
  position: number;
  job: Job;
  notes?: string;
  appliedAt?: ISODateString;
  followUpDate?: ISODateString;
  documents?: {
    cv?: string;
    coverLetter?: string;
  };
  interviews?: Interview[];
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
  isLoading: boolean;
  isDarkMode: boolean;
  userProfile: UserProfile | null;
  selectedJob: Job | null;
  kanbanColumns: KanbanColumn[];
  searchPreferences: SearchPreference[];
  activeSearchPreference: SearchPreference | null;
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