import { useState, useEffect } from 'react';

interface ApplicationStats {
  totalApplications: number;
  responseRate: number;
  averageResponseTime: number;
}

export function useApplicationStats() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await window.__TAURI__.invoke('get_application_stats');
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