/**
 * Types de base pour l'application
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CommuteLocation {
  duration: number; // in minutes
  distance: number; // in km
  mode: 'driving' | 'transit' | 'walking' | 'bicycling';
  coordinates?: Coordinates;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'monster' | 'custom';
  publishedAt: string; // ISO date string
  salary?: string;
  matchingScore: number; // 0-1 scale
  commuteTimes: {
    primaryHome: CommuteLocation;
    secondaryHome?: CommuteLocation;
  };
  skills?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: 'USD' | 'EUR' | 'GBP'; // Add more as needed
}

export interface SearchCriteria {
  keywords: string[];
  location?: string;
  radius?: number; // in km
  jobType?: ('full-time' | 'part-time' | 'contract' | 'internship')[];
  datePosted?: '24h' | 'week' | 'last_week' | 'month' | 'any';
  salary?: SalaryRange;
  commuteTime?: {
    max: number; // max minutes
    from: 'primary' | 'secondary' | 'both';
  };
  experienceLevel?: ('entry' | 'mid' | 'senior' | 'executive')[];
}

export interface CVInfo {
  path: string;
  lastUpdated: string; // ISO date string
  skills?: string[];
  experienceYears?: number;
}

export interface UserProfile {
  id: number;
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
  };
}

export interface KanbanCard {
  id: number;
  jobId: number;
  columnId: number;
  position: number;
  job: Job;
  notes?: string;
  appliedAt?: string; // ISO date string
  followUpDate?: string; // ISO date string
}

export interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  cards: KanbanCard[];
  color?: string; // hex color
}

export interface KeywordWeight {
  keyword: string;
  weight: number; // 1-10 scale
}

export interface SearchCategory {
  id: number;
  name: string;
  keywords: KeywordWeight[];
}

export interface SearchPreference {
  id: number;
  name: string;
  isActive: boolean;
  categories: SearchCategory[];
}

export interface LLMModel {
  name: string;
  maxTokens: number;
}

export interface LLMProvider {
  id: number;
  name: string;
  type: 'local' | 'openai' | 'mistral' | 'anthropic' | 'groq' | 'custom';
  isActive: boolean;
  priority: number; // 1-10 scale
  models: LLMModel[];
  costPer1kTokens: number;
  apiKey?: string; // encrypted in real app
}

export interface DocumentTemplate {
  id: number;
  name: string;
  type: 'cv' | 'coverLetter' | 'email' | 'followUp';
  content: string;
  variables?: string[]; // template variables like {{companyName}}
}

export interface GeneratedDocument {
  id: number;
  jobId: number;
  templateId: number;
  type: DocumentTemplate['type'];
  content: string;
  createdAt: string; // ISO date string
  version?: number;
}