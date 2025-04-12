// Service pour les appels API via Tauri
// For Tauri 2.x:
import { invoke } from '@tauri-apps/api/core';


import type { 
  Job, 
  SearchCriteria, 
  UserProfile, 
  KanbanColumn, 
  SearchPreference, 
  LLMProvider, 
  DocumentTemplate, 
  GeneratedDocument 
} from '../types';

// Service pour les offres d'emploi
export const jobService = {
  async searchJobs(criteria: SearchCriteria): Promise<Job[]> {
    return await invoke<Job[]>('search_jobs', { criteria });
  },
  
  async getJobDetails(jobId: number): Promise<Job> {
    return await invoke<Job>('get_job_details', { jobId });
  },
  
  async calculateMatchingScore(jobId: number): Promise<number> {
    return await invoke<number>('calculate_matching_score', { jobId });
  },
  
  async calculateCommuteTimes(jobId: number): Promise<Job['commuteTimes']> {
    return await invoke<Job['commuteTimes']>('calculate_commute_times', { jobId });
  },
  
  async detectDuplicates(jobId: number): Promise<number[]> {
    return await invoke<number[]>('detect_duplicates', { jobId });
  }
};

// Service pour le profil utilisateur
export const userService = {
  async getUserProfile(): Promise<UserProfile> {
    return await invoke<UserProfile>('get_user_profile');
  },
  
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return await invoke<UserProfile>('update_user_profile', { profile });
  },
  
  async importCV(path: string): Promise<boolean> {
    return await invoke<boolean>('import_cv', { path });
  },
  
  async getSearchPreferences(): Promise<SearchPreference[]> {
    return await invoke<SearchPreference[]>('get_search_preferences');
  },
  
  async updateSearchPreferences(preferences: SearchPreference): Promise<boolean> {
    return await invoke<boolean>('update_search_preferences', { preferences });
  }
};

// Service pour le Kanban
export const kanbanService = {
  async getKanbanColumns(): Promise<KanbanColumn[]> {
    return await invoke<KanbanColumn[]>('get_kanban_columns');
  },
  
  async moveCard(cardId: number, toColumnId: number, position: number): Promise<boolean> {
    return await invoke<boolean>('move_kanban_card', { cardId, toColumnId, position });
  },
  
  async addCard(jobId: number, columnId: number): Promise<KanbanColumn[]> {
    return await invoke<KanbanColumn[]>('add_kanban_card', { jobId, columnId });
  },
  
  async updateCardNotes(cardId: number, notes: string): Promise<boolean> {
    return await invoke<boolean>('update_card_notes', { cardId, notes });
  },
  
  async syncWithNocoDB(): Promise<boolean> {
    return await invoke<boolean>('sync_with_nocodb');
  }
};

// Service pour les LLM
export const llmService = {
  async getLLMProviders(): Promise<LLMProvider[]> {
    return await invoke<LLMProvider[]>('get_llm_providers');
  },
  
  async updateLLMProvider(provider: Partial<LLMProvider>): Promise<boolean> {
    return await invoke<boolean>('update_llm_provider', { provider });
  },
  
  async generateSuggestions(): Promise<string[]> {
    return await invoke<string[]>('generate_search_suggestions');
  },
  
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await invoke<DocumentTemplate[]>('get_document_templates');
  },
  
  async generateDocument(
    jobId: number, 
    templateId: number, 
    type: 'cv' | 'coverLetter' | 'email'
  ): Promise<GeneratedDocument> {
    return await invoke<GeneratedDocument>('generate_document', { jobId, templateId, type });
  }
};

// Service pour les statistiques
export const statsService = {
  async getJobStats(): Promise<unknown> {
    return await invoke('get_job_stats');
  },
  
  async getApplicationStats(): Promise<unknown> {
    return await invoke('get_application_stats');
  },
  
  async getAPIUsageStats(): Promise<unknown> {
    return await invoke('get_api_usage_stats');
  }
};