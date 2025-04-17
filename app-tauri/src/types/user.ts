import type { Education } from './index';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  location?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  education?: Education[];
  skills?: string[];
  languages?: string[];
  experience?: string;
  preferredJobTypes?: string[];
  preferredLocations?: string[];
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  availability?: string;
  noticePeriod?: number;
  createdAt: string;
  updatedAt: string;
} 