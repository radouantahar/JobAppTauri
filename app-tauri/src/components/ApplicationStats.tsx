import React, { useEffect, useState } from 'react';
import { ApplicationStats, ApplicationStatus } from '../types/core';
import { ApplicationService } from '../services/applicationService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = {
  favorite: '#FFD700',
  applied: '#4CAF50',
  interview: '#2196F3',
  offer: '#9C27B0',
  rejected: '#F44336',
  archived: '#9E9E9E'
};

export const ApplicationStats: React.FC = () => {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ApplicationService.getApplicationStats();
        setStats(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Chargement des statistiques...</div>;
  }

  if (!stats) {
    return <div>Erreur lors du chargement des statistiques</div>;
  }

  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const monthlyData = Object.entries(stats.byMonth).map(([month, count]) => ({
    name: month,
    applications: count
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total des candidatures</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Temps de réponse moyen</h3>
          <p className="text-3xl font-bold">{stats.averageResponseTime} jours</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Taux de succès</h3>
          <p className="text-3xl font-bold">{stats.successRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Répartition par statut</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as ApplicationStatus]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Évolution mensuelle</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}; 