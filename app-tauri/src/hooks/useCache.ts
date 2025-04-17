import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number;
}

interface CacheStore {
  cache: Record<string, CacheState<any>>;
  setCache: (key: string, data: any) => void;
  getCache: (key: string) => any;
  clearCache: () => void;
  isExpired: (key: string, ttl: number) => boolean;
}

const useCacheStore = create<CacheStore>()(
  persist(
    (set, get) => ({
      cache: {},
      setCache: (key: string, data: any) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              data,
              loading: false,
              error: null,
              timestamp: Date.now(),
            },
          },
        }));
      },
      getCache: (key: string) => {
        return get().cache[key]?.data;
      },
      clearCache: () => {
        set({ cache: {} });
      },
      isExpired: (key: string, ttl: number) => {
        const cache = get().cache[key];
        if (!cache) return true;
        return Date.now() - cache.timestamp > ttl;
      },
    }),
    {
      name: 'cache-storage',
    }
  )
);

export const useCache = <T>(key: string, ttl: number = 5 * 60 * 1000) => {
  const { cache, setCache, getCache, isExpired } = useCacheStore();

  const get = (): T | null => {
    if (isExpired(key, ttl)) {
      return null;
    }
    return getCache(key);
  };

  const set = (data: T) => {
    setCache(key, data);
  };

  const clear = () => {
    useCacheStore.getState().clearCache();
  };

  return {
    get,
    set,
    clear,
    isExpired: () => isExpired(key, ttl),
  };
}; 