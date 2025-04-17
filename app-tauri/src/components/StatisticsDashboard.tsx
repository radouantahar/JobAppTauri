import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  Paper, 
  Text, 
  Title, 
  Group, 
  Stack,
  LoadingOverlay,
  Alert,
  Skeleton,
  ActionIcon
} from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useJobSearch } from '../hooks/useJobSearch';
import type { Job, Document } from '../types';
import type { AuthContextType } from '../contexts/AuthContext';
import classes from '../styles/components/StatisticsDashboard.module.css';

/**
 * Interface représentant les statistiques du tableau de bord
 */
interface Statistics {
  /** Nombre total d'offres d'emploi */
  totalJobs: number;
  /** Nombre de candidatures envoyées */
  applicationsSent: number;
  /** Nombre d'entretiens programmés */
  interviewsScheduled: number;
  /** Nombre d'offres reçues */
  offersReceived: number;
  /** Nombre de documents uploadés */
  documentsUploaded: number;
  /** Temps de réponse moyen en jours */
  averageResponseTime: number;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const INITIAL_STATISTICS: Statistics = {
  totalJobs: 0,
  applicationsSent: 0,
  interviewsScheduled: 0,
  offersReceived: 0,
  documentsUploaded: 0,
  averageResponseTime: 0
};

/**
 * Composant de tableau de bord affichant les statistiques de recherche d'emploi
 * @returns Le composant de tableau de bord
 */
const StatisticsDashboard: React.FC = React.memo(() => {
  const auth = useAuth() as AuthContextType;
  const { getDocuments } = useJobSearch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics>(INITIAL_STATISTICS);
  const cacheRef = useRef<{
    data: Statistics;
    timestamp: number;
  }>({ data: INITIAL_STATISTICS, timestamp: 0 });

  const loadStatistics = useCallback(async () => {
    if (!auth.user) return;

    // Vérifier le cache
    const now = Date.now();
    if (now - cacheRef.current.timestamp < CACHE_EXPIRY) {
      setStatistics(cacheRef.current.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const documents = await getDocuments();
      
      const newStats = {
        totalJobs: 50,
        applicationsSent: 30,
        interviewsScheduled: 10,
        offersReceived: 2,
        documentsUploaded: documents.length,
        averageResponseTime: 3.5
      };

      setStatistics(newStats);
      cacheRef.current = {
        data: newStats,
        timestamp: now
      };
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [auth.user, getDocuments]);

  useEffect(() => {
    if (auth.user) {
      loadStatistics();
    }
  }, [auth.user, loadStatistics]);

  const handleRefresh = useCallback(() => {
    cacheRef.current = { data: INITIAL_STATISTICS, timestamp: 0 };
    loadStatistics();
  }, [loadStatistics]);

  const StatCard = useMemo(() => React.memo(({ 
    value, 
    label 
  }: { 
    value: number; 
    label: string 
  }) => (
    <Paper className={classes.statCard}>
      {isLoading ? (
        <Skeleton height={24} width="60%" mb="xs" />
      ) : (
        <Text className={classes.statValue}>{value}</Text>
      )}
      <Text className={classes.statLabel}>{label}</Text>
    </Paper>
  )), [isLoading]);

  const DetailCard = useMemo(() => React.memo(({ 
    title, 
    label, 
    value 
  }: { 
    title: string; 
    label: string; 
    value: number 
  }) => (
    <Paper className={classes.detailCard}>
      <Text className={classes.detailTitle}>{title}</Text>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">{label}</Text>
        {isLoading ? (
          <Skeleton height={20} width="40%" />
        ) : (
          <Text className={classes.detailValue}>{value}</Text>
        )}
      </Group>
    </Paper>
  )), [isLoading]);

  if (!auth.user) {
    return (
      <Alert 
        icon={<IconAlertCircle size={16} />} 
        title="Accès non autorisé" 
        color="red"
      >
        Vous devez être connecté pour accéder aux statistiques.
      </Alert>
    );
  }

  return (
    <Paper className={classes.container}>
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} className={classes.title}>Tableau de bord</Title>
          <ActionIcon 
            variant="light" 
            onClick={handleRefresh}
            loading={isLoading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
        
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <div className={classes.statsGrid}>
          <StatCard value={statistics.totalJobs} label="Offres totales" />
          <StatCard value={statistics.applicationsSent} label="Candidatures envoyées" />
          <StatCard value={statistics.interviewsScheduled} label="Entretiens programmés" />
          <StatCard value={statistics.offersReceived} label="Offres reçues" />
        </div>

        <div className={classes.detailsGrid}>
          <DetailCard 
            title="Documents" 
            label="Documents uploadés" 
            value={statistics.documentsUploaded} 
          />
          <DetailCard 
            title="Temps de réponse moyen" 
            label="Jours" 
            value={statistics.averageResponseTime} 
          />
        </div>
      </Stack>
    </Paper>
  );
});

export default StatisticsDashboard; 