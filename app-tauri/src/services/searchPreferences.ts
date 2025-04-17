import { invoke } from '@tauri-apps/api/tauri';

export interface SearchPreference {
  id: string;
  user_id: string;
  keywords?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  contract_types: string[];
  experience_levels: string[];
  remote?: boolean;
  skills: string[];
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  keywords?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  contract_types: string[];
  experience_levels: string[];
  remote?: boolean;
  skills: string[];
}

export interface SearchAlert {
  id: string;
  user_id: string;
  filter_id: string;
  frequency: string;
  last_notification?: string;
  is_active: boolean;
}

export const searchPreferencesService = {
  async getSearchPreferences(userId: string): Promise<SearchPreference> {
    return invoke('get_search_preferences', { userId });
  },

  async updateSearchPreferences(preference: SearchPreference): Promise<void> {
    return invoke('update_search_preferences', { preference });
  },

  async saveFilter(filter: SavedFilter): Promise<string> {
    return invoke('save_filter', { filter });
  },

  async getSavedFilters(userId: string): Promise<SavedFilter[]> {
    return invoke('get_saved_filters', { userId });
  },

  async createSearchAlert(alert: Omit<SearchAlert, 'id'>): Promise<string> {
    return invoke('create_search_alert', { alert });
  },

  async updateSearchAlert(alertId: string, updates: Partial<SearchAlert>): Promise<void> {
    return invoke('update_search_alert', { alertId, updates });
  },

  async deleteSearchAlert(alertId: string): Promise<void> {
    return invoke('delete_search_alert', { alertId });
  },

  async getSearchAlerts(userId: string): Promise<SearchAlert[]> {
    return invoke('get_search_alerts', { userId });
  },

  async toggleSearchAlert(alertId: string, isActive: boolean): Promise<void> {
    return invoke('toggle_search_alert', { alertId, isActive });
  }
}; 