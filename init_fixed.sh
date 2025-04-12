#!/usr/bin/env bash

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Installation en cours..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    elif [[ "$OSTYPE" == "msys" ]]; then
        winget install OpenJS.NodeJS.LTS
    fi
fi

# Vérifier si Rust est installé
if ! command -v rustc &> /dev/null; then
    echo "Rust n'est pas installé. Installation en cours..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Installer les dépendances système pour Tauri
echo "Installation des dépendances système pour Tauri..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt update
    sudo apt install -y libwebkit2gtk-4.0-dev \
        build-essential \
        curl \
        wget \
        libssl-dev \
        libgtk-3-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev \
        patchelf
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS détecté, pas besoin d'installations supplémentaires"
elif [[ "$OSTYPE" == "msys" ]]; then
    echo "Windows détecté, pas besoin d'installations supplémentaires"
fi

# Supprimer le répertoire du projet s'il existe déjà
if [ -d "app-tauri" ]; then
    echo "Suppression du répertoire app-tauri existant..."
    # On Windows, we need to handle directory removal differently
    if [[ "$OSTYPE" == "msys" ]]; then
        rm -rf app-tauri
        # Wait a moment for the directory to be fully removed
        sleep 1
    else
        rm -rf app-tauri
    fi
fi

# Créer le répertoire du projet
mkdir -p app-tauri
cd app-tauri || exit

# Initialiser un projet React avec TypeScript via Vite
echo "Création du projet React avec TypeScript..."
npm create vite@latest . -- --template react-ts --force
npm install

# Installer les dépendances Tauri V2
echo "Installation des dépendances Tauri V2..."
npm install --save-dev @tauri-apps/cli@next @tauri-apps/api@next

# Ajouter les scripts Tauri au package.json
echo "Ajout des scripts Tauri..."
jq '.scripts += {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
}' package.json > package.tmp.json && mv package.tmp.json package.json

# Initialiser Tauri V2 dans le projet
echo "Initialisation de Tauri V2..."
npx @tauri-apps/cli@next init --frontend-dist dist --force

# Installer les dépendances supplémentaires pour l'interface
echo "Installation des dépendances supplémentaires..."
npm install react-router-dom \
    @mantine/core \
    @mantine/hooks \
    @mantine/form \
    @mantine/dates \
    @mantine/notifications \
    @mantine/dropzone \
    @tabler/icons-react \
    dayjs \
    @tanstack/react-query \
    zustand \
    chart.js \
    react-chartjs-2 \
    leaflet \
    react-leaflet \
    @types/leaflet

# Créer la structure de répertoires nécessaire
mkdir -p src/{types,services,store,components,pages}

# Types de base
cat > src/types/index.ts << 'EOL'
// Types de base pour l'application

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
  matchingScore: number;
  commuteTimes: {
    primaryHome: {
      duration: number;
      distance: number;
      mode: string;
    };
    secondaryHome?: {
      duration: number;
      distance: number;
      mode: string;
    };
  };
}

export interface SearchCriteria {
  keywords: string[];
  location?: string;
  radius?: number;
  jobType?: string[];
  datePosted?: string;
  salary?: {
    min?: number;
    max?: number;
  };
  commuteTime?: {
    max: number;
    from: 'primary' | 'secondary' | 'both';
  };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  locations: {
    primary: string;
    secondary?: string;
  };
  cv: {
    path: string;
    lastUpdated: string;
  };
}

export interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  cards: KanbanCard[];
}

export interface KanbanCard {
  id: number;
  jobId: number;
  columnId: number;
  position: number;
  job: Job;
  notes?: string;
  appliedAt?: string;
}

export interface SearchPreference {
  id: number;
  name: string;
  isActive: boolean;
  categories: {
    id: number;
    name: string;
    keywords: {
      keyword: string;
      weight: number;
    }[];
  }[];
}

export interface LLMProvider {
  id: number;
  name: string;
  type: 'local' | 'openai' | 'mistral' | 'anthropic' | 'groq';
  isActive: boolean;
  priority: number;
  models: string[];
  costPer1kTokens: number;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  type: 'cv' | 'coverLetter' | 'email';
  content: string;
}

export interface GeneratedDocument {
  id: number;
  jobId: number;
  templateId: number;
  type: 'cv' | 'coverLetter' | 'email';
  content: string;
  createdAt: string;
}
EOL

# Service API
cat > src/services/api.ts << 'EOL'
// Service pour les appels API via Tauri
import { invoke } from '@tauri-apps/api';
import { Job, SearchCriteria, UserProfile, KanbanColumn, SearchPreference, LLMProvider, DocumentTemplate, GeneratedDocument } from '../types';

// Service pour les offres d'emploi
export const jobService = {
  async searchJobs(criteria: SearchCriteria): Promise<Job[]> {
    return invoke('search_jobs', { criteria });
  },
  
  async getJobDetails(jobId: number): Promise<Job> {
    return invoke('get_job_details', { jobId });
  },
  
  async calculateMatchingScore(jobId: number): Promise<number> {
    return invoke('calculate_matching_score', { jobId });
  },
  
  async calculateCommuteTimes(jobId: number): Promise<Job['commuteTimes']> {
    return invoke('calculate_commute_times', { jobId });
  },
  
  async detectDuplicates(jobId: number): Promise<number[]> {
    return invoke('detect_duplicates', { jobId });
  }
};

// Service pour le profil utilisateur
export const userService = {
  async getUserProfile(): Promise<UserProfile> {
    return invoke('get_user_profile');
  },
  
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return invoke('update_user_profile', { profile });
  },
  
  async importCV(path: string): Promise<boolean> {
    return invoke('import_cv', { path });
  },
  
  async getSearchPreferences(): Promise<SearchPreference[]> {
    return invoke('get_search_preferences');
  },
  
  async updateSearchPreferences(preferences: SearchPreference): Promise<boolean> {
    return invoke('update_search_preferences', { preferences });
  }
};

// Service pour le Kanban
export const kanbanService = {
  async getKanbanColumns(): Promise<KanbanColumn[]> {
    return invoke('get_kanban_columns');
  },
  
  async moveCard(cardId: number, toColumnId: number, position: number): Promise<boolean> {
    return invoke('move_kanban_card', { cardId, toColumnId, position });
  },
  
  async addCard(jobId: number, columnId: number): Promise<KanbanColumn[]> {
    return invoke('add_kanban_card', { jobId, columnId });
  },
  
  async updateCardNotes(cardId: number, notes: string): Promise<boolean> {
    return invoke('update_card_notes', { cardId, notes });
  },
  
  async syncWithNocoDB(): Promise<boolean> {
    return invoke('sync_with_nocodb');
  }
};

// Service pour les LLM
export const llmService = {
  async getLLMProviders(): Promise<LLMProvider[]> {
    return invoke('get_llm_providers');
  },
  
  async updateLLMProvider(provider: Partial<LLMProvider>): Promise<boolean> {
    return invoke('update_llm_provider', { provider });
  },
  
  async generateSuggestions(): Promise<string[]> {
    return invoke('generate_search_suggestions');
  },
  
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return invoke('get_document_templates');
  },
  
  async generateDocument(jobId: number, templateId: number, type: 'cv' | 'coverLetter' | 'email'): Promise<GeneratedDocument> {
    return invoke('generate_document', { jobId, templateId, type });
  }
};

// Service pour les statistiques
export const statsService = {
  async getJobStats(): Promise<any> {
    return invoke('get_job_stats');
  },
  
  async getApplicationStats(): Promise<any> {
    return invoke('get_application_stats');
  },
  
  async getAPIUsageStats(): Promise<any> {
    return invoke('get_api_usage_stats');
  }
};
EOL

# Store global avec Zustand
cat > src/store/index.ts << 'EOL'
// Store global avec Zustand
import create from 'zustand';
import { Job, UserProfile, KanbanColumn, SearchPreference } from '../types';

interface AppState {
  // État de l'interface
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  
  // Thème
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Profil utilisateur
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  
  // Offres d'emploi
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  
  // Kanban
  kanbanColumns: KanbanColumn[];
  setKanbanColumns: (columns: KanbanColumn[]) => void;
  
  // Préférences de recherche
  searchPreferences: SearchPreference[];
  setSearchPreferences: (preferences: SearchPreference[]) => void;
  activeSearchPreference: SearchPreference | null;
  setActiveSearchPreference: (preference: SearchPreference) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // État de l'interface
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  
  // Thème
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // Profil utilisateur
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  // Offres d'emploi
  selectedJob: null,
  setSelectedJob: (job) => set({ selectedJob: job }),
  
  // Kanban
  kanbanColumns: [],
  setKanbanColumns: (columns) => set({ kanbanColumns: columns }),
  
  // Préférences de recherche
  searchPreferences: [],
  setSearchPreferences: (preferences) => set({ searchPreferences: preferences }),
  activeSearchPreference: null,
  setActiveSearchPreference: (preference) => set({ activeSearchPreference: preference }),
}));
EOL

# Composant de navigation
cat > src/components/Navigation.tsx << 'EOL'
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Group, Text, UnstyledButton, createStyles, rem, Tooltip } from '@mantine/core';
import { 
  IconDashboard, 
  IconSearch, 
  IconLayoutKanban, 
  IconUser, 
  IconFileText, 
  IconMap, 
  IconSettings 
} from '@tabler/icons-react';
import { useAppStore } from '../store';

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
    width: rem(80),
    height: '100vh',
    padding: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    borderRight: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },
  navbarMain: {
    flex: 1,
    marginTop: rem(50),
  },
  link: {
    width: rem(50),
    height: rem(50),
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
    },
  },
  active: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
    },
  },
}));

interface NavbarLinkProps {
  icon: React.FC<any>;
  label: string;
  active?: boolean;
  to: string;
}

function NavbarLink({ icon: Icon, label, active, to }: NavbarLinkProps) {
  const { classes, cx } = useStyles();
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton component={Link} to={to} className={cx(classes.link, { [classes.active]: active })}>
        <Icon size="1.5rem" stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const navLinks = [
  { icon: IconDashboard, label: 'Tableau de bord', to: '/' },
  { icon: IconSearch, label: 'Recherche', to: '/search' },
  { icon: IconLayoutKanban, label: 'Kanban', to: '/kanban' },
  { icon: IconUser, label: 'Profil', to: '/profile' },
  { icon: IconFileText, label: 'Documents', to: '/documents' },
  { icon: IconMap, label: 'Trajets', to: '/commute' },
  { icon: IconSettings, label: 'Paramètres', to: '/settings' },
];

export function Navigation() {
  const { classes } = useStyles();
  const location = useLocation();

  return (
    <Navbar className={classes.navbar}>
      <Navbar.Section grow className={classes.navbarMain}>
        <Group direction="column" spacing={0} position="center">
          {navLinks.map((link) => (
            <NavbarLink
              key={link.label}
              icon={link.icon}
              label={link.label}
              to={link.to}
              active={location.pathname === link.to}
            />
          ))}
        </Group>
      </Navbar.Section>
    </Navbar>
  );
}
EOL

# Composant de carte d'offre d'emploi
cat > src/components/JobCard.tsx << 'EOL'
import React from 'react';
import { Card, Text, Badge, Group, Button, Progress, createStyles, rem } from '@mantine/core';
import { IconMapPin, IconBriefcase, IconClock, IconExternalLink } from '@tabler/icons-react';
import { Job } from '../types';

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows.md,
    },
  },
  title: {
    fontWeight: 700,
    lineHeight: 1.2,
  },
  body: {
    padding: theme.spacing.md,
  },
  commuteBadge: {
    textTransform: 'none',
  },
}));

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const { classes } = useStyles();
  
  // Formater le temps de trajet
  const formatCommuteTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };
  
  // Déterminer la couleur du score de correspondance
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'lime';
    if (score >= 0.4) return 'yellow';
    if (score >= 0.2) return 'orange';
    return 'red';
  };

  return (
    <Card shadow="sm" p={0} radius="md" className={classes.card}>
      <Card.Section className={classes.body}>
        <Group position="apart" mb="xs">
          <Text className={classes.title} lineClamp={2}>{job.title}</Text>
          <Badge color={getScoreColor(job.matchingScore)} variant="filled">
            {Math.round(job.matchingScore * 100)}%
          </Badge>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">{job.company}</Text>
        
        <Group spacing="xs" mb="xs">
          <IconMapPin size={16} />
          <Text size="sm">{job.location}</Text>
        </Group>
        
        {job.salary && (
          <Group spacing="xs" mb="xs">
            <IconBriefcase size={16} />
            <Text size="sm">{job.salary}</Text>
          </Group>
        )}
        
        <Group position="apart" mt="md">
          <Group spacing="xs">
            <IconClock size={16} />
            <Badge 
              className={classes.commuteBadge} 
              color="blue" 
              variant="outline"
              title="Temps de trajet depuis le domicile principal"
            >
              P: {formatCommuteTime(job.commuteTimes.primaryHome.duration)}
            </Badge>
            
            {job.commuteTimes.secondaryHome && (
              <Badge 
                className={classes.commuteBadge} 
                color="violet" 
                variant="outline"
                title="Temps de trajet depuis le domicile secondaire"
              >
                S: {formatCommuteTime(job.commuteTimes.secondaryHome.duration)}
              </Badge>
            )}
          </Group>
          
          <Button 
            variant="light" 
            color="blue" 
            compact
            rightIcon={<IconExternalLink size={16} />}
            onClick={() => onClick(job)}
          >
            Détails
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
}
EOL

# Page d'accueil (Dashboard)
cat > src/pages/Dashboard.tsx << 'EOL'
import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Title, Text, Group, RingProgress, SimpleGrid, Card, useMantineTheme } from '@mantine/core';
import { IconBriefcase, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, ArcElement } from 'chart.js';
import { statsService, jobService, kanbanService } from '../services/api';
import { useAppStore } from '../store';
import { Job, KanbanColumn } from '../types';

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, ArcElement);

export function Dashboard() {
  const theme = useMantineTheme();
  const { setLoading } = useAppStore();
  const [jobStats, setJobStats] = useState<any>(null);
  const [applicationStats, setApplicationStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger les statistiques
        const jobStatsData = await statsService.getJobStats();
        const applicationStatsData = await statsService.getApplicationStats();
        
        // Charger les offres récentes
        const recentJobsData = await jobService.searchJobs({
          keywords: [],
          datePosted: 'last_week'
        });
        
        // Charger les colonnes Kanban
        const kanbanColumnsData = await kanbanService.getKanbanColumns();
        
        setJobStats(jobStatsData);
        setApplicationStats(applicationStatsData);
        setRecentJobs(recentJobsData.slice(0, 5)); // Limiter aux 5 plus récentes
        setKanbanColumns(kanbanColumnsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [setLoading]);

  // Données pour le graphique d'évolution des offres
  const jobTrendData = {
    labels: jobStats?.trendData?.labels || [],
    datasets: [
      {
        label: 'Offres trouvées',
        data: jobStats?.trendData?.values || [],
        borderColor: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[2],
        tension: 0.3,
      },
    ],
  };

  // Données pour le graphique de répartition des sources
  const sourceDistributionData = {
    labels: jobStats?.sourceDistribution?.labels || [],
    datasets: [
      {
        data: jobStats?.sourceDistribution?.values || [],
        backgroundColor: [
          theme.colors.blue[6],
          theme.colors.green[6],
          theme.colors.yellow[6],
          theme.colors.orange[6],
          theme.colors.red[6],
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options des graphiques
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord</Title>
      
      {/* Statistiques principales */}
      <SimpleGrid cols={4} spacing="md" mb="xl">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group position="apart">
            <div>
              <Text size="xs" color="dimmed">Total des offres</Text>
              <Text weight={700} size="xl">{jobStats?.totalJobs || 0}</Text>
            </div>
            <IconBriefcase size={32} color={theme.colors.blue[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group position="apart">
            <div>
              <Text size="xs" color="dimmed">Candidatures envoyées</Text>
              <Text weight={700} size="xl">{applicationStats?.totalApplications || 0}</Text>
            </div>
            <IconCheck size={32} color={theme.colors.green[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group position="apart">
            <div>
              <Text size="xs" color="dimmed">Entretiens</Text>
              <Text weight={700} size="xl">{applicationStats?.totalInterviews || 0}</Text>
            </div>
            <IconClock size={32} color={theme.colors.yellow[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group position="apart">
            <div>
              <Text size="xs" color="dimmed">Offres reçues</Text>
              <Text weight={700} size="xl">{applicationStats?.totalOffers || 0}</Text>
            </div>
            <IconX size={32} color={theme.colors.red[6]} />
          </Group>
        </Card>
      </SimpleGrid>
      
      <Grid gutter="md">
        {/* Graphique d'évolution des offres */}
        <Grid.Col span={8}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Évolution des offres</Title>
            <Line data={jobTrendData} options={chartOptions} />
          </Paper>
        </Grid.Col>
        
        {/* Taux de réussite */}
        <Grid.Col span={4}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Taux de réussite</Title>
            <Group position="center">
              <RingProgress
                size={180}
                thickness={16}
                sections={[
                  { value: applicationStats?.successRate || 0, color: theme.colors.green[6] },
                ]}
                label={
                  <Text size="xl" align="center" weight={700}>
                    {applicationStats?.successRate || 0}%
                  </Text>
                }
              />
            </Group>
            <Text align="center" size="sm" color="dimmed" mt="sm">
              Taux de réponses positives
            </Text>
          </Paper>
        </Grid.Col>
        
        {/* Répartition par source */}
        <Grid.Col span={6}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Répartition par source</Title>
            <Pie data={sourceDistributionData} />
          </Paper>
        </Grid.Col>
        
        {/* Offres récentes */}
        <Grid.Col span={6}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Offres récentes</Title>
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <Group key={job.id} position="apart" mb="xs">
                  <div>
                    <Text weight={500}>{job.title}</Text>
                    <Text size="xs" color="dimmed">{job.company}</Text>
                  </div>
                  <Text size="sm">{new Date(job.publishedAt).toLocaleDateString()}</Text>
                </Group>
              ))
            ) : (
              <Text color="dimmed">Aucune offre récente</Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
EOL

# Fichier principal de l'application
cat > src/App.tsx << 'EOL'
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, AppShell, ColorSchemeProvider, ColorScheme } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAppStore } from './store';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { userService } from './services/api';

// Créer un client React Query
const queryClient = new QueryClient();

function App() {
  const { isDarkMode, toggleDarkMode, setUserProfile } = useAppStore();
  
  // Charger le profil utilisateur au démarrage
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await userService.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur:', error);
      }
    };
    
    loadUserProfile();
  }, [setUserProfile]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeProvider colorScheme={isDarkMode ? 'dark' : 'light'} toggleColorScheme={toggleDarkMode}>
        <MantineProvider theme={{ colorScheme: isDarkMode ? 'dark' : 'light' }} withGlobalStyles withNormalizeCSS>
          <NotificationsProvider>
            <Router>
              <AppShell
                padding="md"
                navbar={<Navigation />}
                styles={(theme) => ({
                  main: {
                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
                  },
                })}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  {/* Autres routes à ajouter ici */}
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </AppShell>
            </Router>
          </NotificationsProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </QueryClientProvider>
  );
}

export default App;
EOL

# Fichier principal
cat > src/main.tsx << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOL

# Styles CSS
cat > src/styles.css << 'EOL'
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
  height: 100vh;
}
EOL

# Créer le fichier main.rs pour Tauri
mkdir -p src-tauri/src
cat > src-tauri/src/main.rs << 'EOL'
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{command, State};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::Path;

// Structure pour stocker l'état de l'application
struct AppState {
    python_path: Mutex<String>,
    app_path: Mutex<String>,
}

// Fonction pour exécuter une commande Python
fn run_python_command(python_path: &str, app_path: &str, script: &str, args: Vec<&str>) -> Result<String, String> {
    let script_path = format!("{}/{}", app_path, script);
    
    let output = Command::new(python_path)
        .arg(&script_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Erreur lors de l'exécution de la commande Python: {}", e))?;
    
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Erreur dans le script Python: {}", stderr))
    }
}

// Commande pour initialiser l'application
#[command]
fn init_app(state: State<AppState>, python_path: String, app_path: String) -> Result<String, String> {
    *state.python_path.lock().unwrap() = python_path.clone();
    *state.app_path.lock().unwrap() = app_path.clone();
    
    // Vérifier que les chemins sont valides
    if !Path::new(&python_path).exists() {
        return Err(format!("Chemin Python invalide: {}", python_path));
    }
    
    if !Path::new(&app_path).exists() {
        return Err(format!("Chemin de l'application invalide: {}", app_path));
    }
    
    Ok("Application initialisée avec succès".to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            python_path: Mutex::new(String::from("python3")),
            app_path: Mutex::new(String::from(".")),
        })
        .invoke_handler(tauri::generate_handler![
            init_app,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Tauri");
}
EOL

# Créer le script de lancement corrigé
cat > run_app.sh << 'EOL'
#!/usr/bin/env bash
npm run tauri dev
EOL

chmod +x run_app.sh

echo "Initialisation du projet Tauri terminée avec succès!"
echo "Pour lancer l'application, exécutez: cd app-tauri && ./run_app.sh"