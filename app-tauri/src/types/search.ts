export interface SearchPreference {
  id: string;
  user_id: string;
  keywords: string;
  radius: number;
  experience_level: string;
  remote_preference: string;
  created_at: string;
  updated_at: string;
}

export interface SearchCriteria {
  keywords?: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  contractTypes?: string[];
  experienceLevels?: string[];
  remote?: boolean;
  skills?: string[];
  jobTypes?: string[];
  sources?: string[];
  postedSince?: number; // Nombre de jours depuis la publication
  sortBy?: 'relevance' | 'date' | 'salary';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 