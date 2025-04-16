export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedAt: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency?: string;
    period?: string;
  };
  description: string;
  url: string;
  remote?: boolean;
  skills?: string[];
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  commuteTimes?: CommuteTime[];
  source?: JobSource;
  matchingScore?: number;
  contractType?: string;
  createdAt?: string;
}

export type ISODateString = string;

export interface SearchFilters {
  keywords: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTypes: string[];
  experienceLevels: string[];
  remote: boolean | undefined;
  skills: string[];
  datePosted: Date | null;
  sortBy: 'relevance' | 'date' | 'salary';
}

export interface SearchCriteria {
  keywords: string;
  location: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  contractTypes?: string[];
  experienceLevels?: string[];
  remote?: boolean;
  skills?: string[];
  datePosted?: Date;
  sortBy?: 'relevance' | 'date' | 'salary';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: SearchPreference;
  location?: string;
  cv?: string;
  experienceLevel?: ExperienceLevel;
  preferredJobTypes?: string[];
  preferredLocations?: string[];
  salaryExpectation?: {
    min: number;
    max: number;
  };
  availability?: string;
  noticePeriod?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  jobId: string;
  status: string;
  createdAt: ISODateString;
  notes?: string;
  interviews?: Interview[];
  updatedAt?: ISODateString;
}

export interface Interview {
  id: string;
  date: ISODateString;
  type: string;
  notes?: string;
}

export interface SearchPreference {
  id: string;
  defaultLocation: string;
  preferredSalaryRange: {
    min: number;
    max: number;
  };
  preferredContractTypes: string[];
  preferredExperienceLevels: string[];
  remotePreference: boolean;
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  description?: string;
  url?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  content: string;
  createdAt: ISODateString;
}

export type DocumentType = 'CV' | 'Lettre de motivation' | 'Autre';

export interface Application {
  id: number;
  job_id: number;
  status: string;
  notes?: string;
  stages?: ApplicationStage[];
  documents?: ApplicationDocument[];
  application_notes?: ApplicationNote[];
  created_at: string;
  updated_at: string;
}

export interface ApplicationStage {
  id: number;
  application_id: number;
  stage_type: string;
  scheduled_at?: string;
  completed_at?: string;
  notes?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: number;
  application_id: number;
  document_type: string;
  file_path?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: number;
  application_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 
  | 'pending'
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'
  | 'withdrawn';

export type StageType =
  | 'phone_screen'
  | 'technical_interview'
  | 'behavioral_interview'
  | 'coding_test'
  | 'take_home_assignment'
  | 'onsite_interview'
  | 'reference_check'
  | 'offer_discussion';

export type ApplicationDocumentType =
  | 'cv'
  | 'cover_letter'
  | 'portfolio'
  | 'references'
  | 'certificates'
  | 'other';

export interface CommuteTime {
  mode: CommuteMode;
  duration: number;
  distance: number;
}

export type AppState = {
  userProfile: UserProfile | null;
  searchFilters: SearchFilters;
  applications: Application[];
  kanbanColumns: KanbanColumn[];
  isAuthenticated: boolean;
};

export type JobType = 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead';
export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'other';
export type CommuteMode = 'walking' | 'driving' | 'transit' | 'biking';
export type LLMProvider = 'openai' | 'anthropic' | 'google';

export const DOCUMENT_TYPES: DocumentType[] = ['CV', 'Lettre de motivation', 'Autre'];

export function createISODateString(date: Date): ISODateString {
  return date.toISOString();
} 