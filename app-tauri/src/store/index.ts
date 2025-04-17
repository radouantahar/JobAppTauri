// Store global avec Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, UserProfile, KanbanColumn, SearchPreference, Application, SearchFilters } from '../types';

interface StoreState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  setUserProfile: (profile: UserProfile) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Favorites
  favorites: string[];
  addFavorite: (jobId: string) => void;
  removeFavorite: (jobId: string) => void;

  // Jobs
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;

  // Kanban
  columns: KanbanColumn[];
  setColumns: (columns: KanbanColumn[]) => void;
  addColumn: (column: KanbanColumn) => void;
  updateColumn: (id: number, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (id: number) => void;

  // Search Preferences
  searchPreferences: SearchPreference[];
  setSearchPreferences: (preferences: SearchPreference[]) => void;
  addSearchPreference: (preference: SearchPreference) => void;
  updateSearchPreference: (id: number, updates: Partial<SearchPreference>) => void;
  deleteSearchPreference: (id: number) => void;

  // Applications
  applications: Application[];
  setApplications: (applications: Application[]) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;

  // Search
  searchQuery: string;
  filters: SearchFilters;
  isLoading: boolean;
  error: Error | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  // Reset
  resetSearch: () => void;
}

const defaultFilters: SearchFilters = {
  keywords: '',
  location: '',
  salaryMin: null,
  salaryMax: null,
  contractTypes: [],
  experienceLevels: [],
  remote: undefined,
  skills: [],
  datePosted: null,
  sortBy: 'relevance'
};

export const useAppStore = create<StoreState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: false,
      setUserProfile: (profile) => set({ user: profile, isAuthenticated: true }),

      // Theme
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Favorites
      favorites: [],
      addFavorite: (jobId) => set((state) => ({ favorites: [...state.favorites, jobId] })),
      removeFavorite: (jobId) => set((state) => ({ favorites: state.favorites.filter(id => id !== jobId) })),

      // Jobs
      jobs: [],
      setJobs: (jobs) => set({ jobs }),
      addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(job => job.id === id ? { ...job, ...updates } : job)
      })),
      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(job => job.id !== id)
      })),

      // Kanban
      columns: [],
      setColumns: (columns) => set({ columns }),
      addColumn: (column) => set((state) => ({ columns: [...state.columns, column] })),
      updateColumn: (id: number, updates) => set((state) => ({
        columns: state.columns.map(col => col.id === id ? { ...col, ...updates } : col)
      })),
      deleteColumn: (id: number) => set((state) => ({
        columns: state.columns.filter(col => col.id !== id)
      })),

      // Search Preferences
      searchPreferences: [],
      setSearchPreferences: (preferences) => set({ searchPreferences: preferences }),
      addSearchPreference: (preference) => set((state) => ({
        searchPreferences: [...state.searchPreferences, preference]
      })),
      updateSearchPreference: (id: number, updates) => set((state) => ({
        searchPreferences: state.searchPreferences.map(pref =>
          pref.id === id ? { ...pref, ...updates } : pref
        )
      })),
      deleteSearchPreference: (id: number) => set((state) => ({
        searchPreferences: state.searchPreferences.filter(pref => pref.id !== id)
      })),

      // Applications
      applications: [],
      setApplications: (applications) => set({ applications }),
      addApplication: (application) => set((state) => ({
        applications: [...state.applications, application]
      })),
      updateApplication: (id: string, updates: Partial<Application>) => set((state) => ({
        applications: state.applications.map(app =>
          app.id === id ? { ...app, ...updates } : app
        )
      })),
      deleteApplication: (id: string) => set((state) => ({
        applications: state.applications.filter(app => app.id !== id)
      })),

      // Search
      searchQuery: '',
      filters: defaultFilters,
      isLoading: false,
      error: null,

      // Actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setFilters: (filters: SearchFilters) => set({ filters }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: Error | null) => set({ error }),

      // Reset
      resetSearch: () => set({
        searchQuery: '',
        filters: defaultFilters,
        error: null
      })
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);