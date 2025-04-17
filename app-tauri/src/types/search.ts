export interface SearchPreference {
  id: number;
  name: string;
  keywords: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  contractTypes?: string[];
  experienceLevels?: string[];
  remote?: boolean;
  skills?: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
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