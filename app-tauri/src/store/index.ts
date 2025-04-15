// Store global avec Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, UserProfile, KanbanColumn, SearchPreference } from '../types';

interface AppState {
  // État de l'interface
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  
  // Authentification
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  
  // Thème
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Profil utilisateur
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  
  // Offres d'emploi
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  
  // Favoris
  favorites: Job[];
  addFavorite: (job: Job) => void;
  removeFavorite: (jobId: number) => void;
  
  // Kanban
  kanbanColumns: KanbanColumn[];
  setKanbanColumns: (columns: KanbanColumn[]) => void;
  
  // Préférences de recherche
  searchPreferences: SearchPreference[];
  setSearchPreferences: (preferences: SearchPreference[]) => void;
  activeSearchPreference: SearchPreference | null;
  setActiveSearchPreference: (preference: SearchPreference) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // État de l'interface
      loading: false,
      setLoading: (loading) => set({ loading }),
      isRefreshing: false,
      setIsRefreshing: (isRefreshing) => set({ isRefreshing }),
      
      // Authentification
      isAuthenticated: false,
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      // Thème (persisted)
      isDarkMode: typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-color-scheme: dark)').matches 
        : false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Profil utilisateur
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      // Offres d'emploi
      selectedJob: null,
      setSelectedJob: (job) => set({ selectedJob: job }),
      
      // Favoris
      favorites: [],
      addFavorite: (job) => set((state) => ({
        favorites: [...state.favorites, job]
      })),
      removeFavorite: (jobId) => set((state) => ({
        favorites: state.favorites.filter(job => job.id !== jobId)
      })),
      
      // Kanban
      kanbanColumns: [],
      setKanbanColumns: (columns) => set({ kanbanColumns: columns }),
      
      // Préférences de recherche
      searchPreferences: [],
      setSearchPreferences: (preferences) => set({ searchPreferences: preferences }),
      activeSearchPreference: null,
      setActiveSearchPreference: (preference) => set({ activeSearchPreference: preference }),
    }),
    {
      name: 'app-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage), // or sessionStorage
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        isAuthenticated: state.isAuthenticated,
        favorites: state.favorites,
      }),
    }
  )
);