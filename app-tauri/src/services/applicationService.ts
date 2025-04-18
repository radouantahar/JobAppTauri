import { invoke } from '@tauri-apps/api/tauri';
import { Job } from '../types/job';

export const getFavorites = async (userId: string): Promise<Job[]> => {
  try {
    return await invoke('get_favorite_jobs', { userId });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

export const addToFavorites = async (userId: string, jobId: string): Promise<void> => {
  try {
    await invoke('add_favorite_job', { userId, jobId });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId: string, jobId: string): Promise<void> => {
  try {
    await invoke('remove_favorite_job', { userId, jobId });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const isJobFavorite = async (userId: string, jobId: string): Promise<boolean> => {
  try {
    return await invoke('is_job_favorite', { userId, jobId });
  } catch (error) {
    console.error('Error checking if job is favorite:', error);
    throw error;
  }
}; 