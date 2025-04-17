import { ISODateString } from './core';

export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical';

export interface Interview {
  date: ISODateString;
  type: InterviewType;
  notes?: string;
  contactPerson?: string;
  outcome?: 'positive' | 'negative' | 'pending';
} 