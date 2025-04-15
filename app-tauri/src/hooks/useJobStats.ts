import { useState, useEffect } from 'react';

interface JobStats {
  totalJobs: number;
  trendData: {
    labels: string[];
    values: number[];
  };
  sourceDistribution: {
    labels: string[];
    values: number[];
  };
}

export function useJobStats() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await window.__TAURI__.invoke('get_job_stats');
      setStats(response);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshStats = () => {
    fetchStats();
  };

  return { stats, loading, error, refreshStats };
} 