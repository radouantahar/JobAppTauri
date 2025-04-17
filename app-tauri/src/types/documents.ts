import { ISODateString, UserID } from './core';

/**
 * Type de document
 */
export type DocumentType = 'cv' | 'cover-letter' | 'portfolio' | 'other';

/**
 * Available document types
 */
export const DOCUMENT_TYPES: DocumentType[] = ['cv', 'cover-letter', 'portfolio', 'other'];

/**
 * Document metadata and content
 */
export interface Document {
  id: string;
  userId: UserID;
  name: string;
  type: DocumentType;
  description?: string;
  content?: string;
  size: number;
  url?: string;
  filePath?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  metadata?: {
    version?: number;
    lastModified?: ISODateString;
    author?: string;
    tags?: string[];
  };
}

/**
 * Document template for generation
 */
export interface DocumentTemplate {
  id: number;
  name: string;
  type: DocumentType;
  content: string;
  variables?: string[];
  isDefault?: boolean;
  language?: string;
  metadata?: {
    version?: number;
    lastModified?: ISODateString;
    author?: string;
  };
}

/**
 * Request for document generation
 */
export interface DocumentGenerationRequest {
  jobId: string;
  templateId: number;
  type: DocumentType;
  variables?: Record<string, string>;
  metadata?: {
    version?: number;
    author?: string;
    tags?: string[];
  };
}

/**
 * Generated document with feedback
 */
export interface GeneratedDocument {
  id: number;
  jobId: string;
  templateId: number;
  type: DocumentType;
  content: string;
  createdAt: ISODateString;
  version?: number;
  feedback?: {
    rating?: number; // 1-5 scale
    comments?: string;
    reviewer?: string;
    date?: ISODateString;
  };
  metadata?: {
    author?: string;
    tags?: string[];
    lastModified?: ISODateString;
  };
} 