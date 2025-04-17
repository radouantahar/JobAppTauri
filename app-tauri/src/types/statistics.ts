import { ISODateString } from './core';

/**
 * Statistics for job applications
 */
export interface ApplicationStats {
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  successRate: number;
  averageResponseTime: number; // in days
  conversionRates: {
    applicationToInterview: number;
    interviewToOffer: number;
    offerToAcceptance: number;
  };
  statusDistribution: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
}

/**
 * Statistics for job postings
 */
export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  archivedJobs: number;
  trendData: {
    labels: string[];
    values: number[];
  };
  sourceDistribution: {
    labels: string[];
    values: number[];
  };
  typeDistribution: {
    labels: string[];
    values: number[];
  };
  experienceLevelDistribution: {
    labels: string[];
    values: number[];
  };
}

/**
 * Statistics for documents
 */
export interface DocumentStats {
  totalDocuments: number;
  byType: {
    cv: number;
    'cover-letter': number;
    portfolio: number;
    other: number;
  };
  lastUpdated: ISODateString;
  storageUsage: {
    total: number; // in bytes
    byType: Record<string, number>;
  };
}

/**
 * Dashboard statistics combining all metrics
 */
export interface DashboardStats {
  applications: ApplicationStats;
  jobs: JobStats;
  documents: DocumentStats;
  lastUpdated: ISODateString;
  performanceMetrics: {
    averageLoadTime: number;
    apiResponseTime: number;
    databaseQueryTime: number;
  };
}

/**
 * Time range for statistics
 */
export type StatsTimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Statistics request parameters
 */
export interface StatsRequest {
  timeRange: StatsTimeRange;
  startDate?: ISODateString;
  endDate?: ISODateString;
  groupBy?: 'day' | 'week' | 'month';
  filters?: {
    jobType?: string[];
    experienceLevel?: string[];
    source?: string[];
  };
} 