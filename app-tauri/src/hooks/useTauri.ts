import { invoke } from '@tauri-apps/api/tauri';

export const useTauri = () => {
  return {
    invoke: async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
      try {
        return await invoke<T>(command, args);
      } catch (error) {
        console.error(`Error invoking Tauri command ${command}:`, error);
        throw error;
      }
    },
  };
}; 