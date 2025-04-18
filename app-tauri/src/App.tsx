import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, AppShell, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import { userService } from './services/api';
import Search from './pages/Search';
import Kanban from './pages/Kanban';
import { Profile } from './pages/Profile';
import { Documents } from './pages/Documents';
import CommutePage from './pages/Commute';
import { SettingsPage } from './pages/Settings';
import { ApplicationList } from './components/applications/ApplicationList';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  const { isDarkMode, setUserProfile, isAuthenticated } = useAppStore();
  
  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await userService.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [setUserProfile]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        defaultColorScheme={isDarkMode ? 'dark' : 'light'}
        theme={{
          primaryColor: 'blue',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <ColorSchemeScript />
        <Notifications position="top-right" zIndex={1000} />
        <Router>
          <AppShell
            navbar={{ width: 80, breakpoint: 'sm' }}
            padding="md"
          >
            <AppShell.Navbar p="md">
              <Navigation isAuthenticated={isAuthenticated} />
            </AppShell.Navbar>
            <AppShell.Main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/commute" element={<CommutePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/applications" element={<ApplicationList />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </AppShell.Main>
          </AppShell>
        </Router>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;