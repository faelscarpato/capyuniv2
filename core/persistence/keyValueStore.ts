import { get, set } from 'idb-keyval';

export const keyValueStore = {
  get: async <T>(key: string): Promise<T | undefined> => {
    return get<T>(key);
  },
  set: async <T>(key: string, value: T): Promise<void> => {
    await set(key, value);
  }
};

