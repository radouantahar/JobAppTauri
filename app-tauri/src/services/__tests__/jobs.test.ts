import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';
import {
  searchJobs,
  getJobDetails,
  saveJob,
  updateJobStatus,
  getJobStats,
} from '../api';

// Mock de l'API Tauri
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Jobs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchJobs', () => {
    it('devrait retourner les offres correspondantes', async () => {
      const mockJobs = [
        {
          id: 1,
          title: 'Développeur Full Stack',
          company: 'Tech Corp',
          matching_score: 0.85,
        },
        {
          id: 2,
          title: 'Ingénieur DevOps',
          company: 'Cloud Inc',
          matching_score: 0.75,
        },
      ];

      (invoke as any).mockResolvedValueOnce(mockJobs);

      const result = await searchJobs({
        keywords: 'développeur',
        location: 'Paris',
      });

      expect(result).toEqual(mockJobs);
      expect(invoke).toHaveBeenCalledWith('search_jobs', {
        keywords: 'développeur',
        location: 'Paris',
      });
    });

    it('devrait gérer les résultats vides', async () => {
      (invoke as any).mockResolvedValueOnce([]);

      const result = await searchJobs({
        keywords: 'inexistant',
        location: 'Nullepart',
      });

      expect(result).toEqual([]);
    });
  });

  describe('getJobDetails', () => {
    it('devrait retourner les détails d\'une offre', async () => {
      const mockJob = {
        id: 1,
        title: 'Développeur Full Stack',
        company: 'Tech Corp',
        description: 'Description détaillée',
        requirements: ['Rust', 'React'],
        matching_score: 0.85,
      };

      (invoke as any).mockResolvedValueOnce(mockJob);

      const result = await getJobDetails(1);

      expect(result).toEqual(mockJob);
      expect(invoke).toHaveBeenCalledWith('get_job_details', { id: 1 });
    });

    it('devrait gérer les offres inexistantes', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Job not found'));

      await expect(getJobDetails(999)).rejects.toThrow('Job not found');
    });
  });

  describe('saveJob', () => {
    it('devrait sauvegarder une nouvelle offre', async () => {
      const mockJob = {
        id: 1,
        title: 'Nouvelle Offre',
        company: 'Nouvelle Entreprise',
        matching_score: 0.9,
      };

      (invoke as any).mockResolvedValueOnce(mockJob);

      const result = await saveJob({
        title: 'Nouvelle Offre',
        company: 'Nouvelle Entreprise',
        description: 'Description',
      });

      expect(result).toEqual(mockJob);
      expect(invoke).toHaveBeenCalledWith('save_job', {
        title: 'Nouvelle Offre',
        company: 'Nouvelle Entreprise',
        description: 'Description',
      });
    });

    it('devrait gérer les erreurs de sauvegarde', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Save failed'));

      await expect(
        saveJob({
          title: 'Offre Erronée',
          company: 'Entreprise',
          description: 'Description',
        })
      ).rejects.toThrow('Save failed');
    });
  });

  describe('updateJobStatus', () => {
    it('devrait mettre à jour le statut d\'une offre', async () => {
      (invoke as any).mockResolvedValueOnce(true);

      const result = await updateJobStatus(1, 'applied');

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith('update_job_status', {
        id: 1,
        status: 'applied',
      });
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateJobStatus(1, 'invalid_status')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('getJobStats', () => {
    it('devrait retourner les statistiques des offres', async () => {
      const mockStats = {
        total_jobs: 10,
        status_distribution: [
          { status: 'new', count: 5 },
          { status: 'applied', count: 3 },
          { status: 'interview', count: 2 },
        ],
        source_distribution: [
          { source: 'linkedin', count: 6 },
          { source: 'indeed', count: 4 },
        ],
      };

      (invoke as any).mockResolvedValueOnce(mockStats);

      const result = await getJobStats();

      expect(result).toEqual(mockStats);
      expect(invoke).toHaveBeenCalledWith('get_job_stats');
    });

    it('devrait gérer les statistiques vides', async () => {
      (invoke as any).mockResolvedValueOnce({
        total_jobs: 0,
        status_distribution: [],
        source_distribution: [],
      });

      const result = await getJobStats();

      expect(result.total_jobs).toBe(0);
      expect(result.status_distribution).toEqual([]);
      expect(result.source_distribution).toEqual([]);
    });
  });
}); 