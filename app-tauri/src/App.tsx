import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, AppShell, Group, Button, Loader } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '@/contexts/AuthContext';
import { IconChartBar, IconFileText } from '@tabler/icons-react';
import { theme } from './styles/theme';
import './styles/index.css';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTauri } from './hooks/useTauri';

// Chargement paresseux des composants
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Search = lazy(() => import('@/pages/Search'));
const Kanban = lazy(() => import('@/pages/Kanban'));
const Documents = lazy(() => import('@/pages/Documents'));
const Profile = lazy(() => import('@/pages/Profile'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const Commute = lazy(() => import('@/pages/Commute'));
const Stats = lazy(() => import('@/pages/Stats'));
const DocumentManager = lazy(() => import('@/components/DocumentManager'));

type Tab = 'dashboard' | 'documents';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  useTauri();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <Router>
      <MantineProvider theme={theme}>
        <AppShell
          padding="md"
          navbar={{
            width: { base: 300 },
            breakpoint: 'sm',
          }}
          header={{
            height: 60,
          }}
          className="animate-fade-in"
        >
          <AppShell.Navbar p="xs" className="animate-slide-in">
            <Group className="space-y-4">
              <Button
                variant={activeTab === 'dashboard' ? 'filled' : 'light'}
                onClick={() => handleTabChange('dashboard')}
                className="hover-lift"
              >
                <IconChartBar size={16} className="mr-2" />
                Tableau de bord
              </Button>
              <Button
                variant={activeTab === 'documents' ? 'filled' : 'light'}
                onClick={() => handleTabChange('documents')}
                className="hover-lift"
              >
                <IconFileText size={16} className="mr-2" />
                Documents
              </Button>
            </Group>
          </AppShell.Navbar>

          <AppShell.Main className="animate-fade-in delay-100">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader size="lg" />
                </div>
              }
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      {activeTab === 'dashboard' ? <Dashboard /> : <DocumentManager />}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kanban"
                  element={
                    <ProtectedRoute>
                      <Kanban />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <Documents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs"
                  element={
                    <ProtectedRoute>
                      <Jobs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/commute"
                  element={
                    <ProtectedRoute>
                      <Commute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <ProtectedRoute>
                      <Stats />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </AppShell.Main>
        </AppShell>
        <Notifications />
      </MantineProvider>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;