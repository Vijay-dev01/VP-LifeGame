import { Platform } from 'react-native';

let memoryFallback: Record<string, string> = {};

function getWebStorage() {
  return {
    getItem: async (name: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(name);
        }
      } catch (_) {}
      return memoryFallback[name] ?? null;
    },
    setItem: (name: string, value: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(name, value);
          return Promise.resolve();
        }
      } catch (_) {}
      memoryFallback[name] = value;
      return Promise.resolve();
    },
    removeItem: (name: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(name);
          return Promise.resolve();
        }
      } catch (_) {}
      delete memoryFallback[name];
      return Promise.resolve();
    },
  };
}

export function createSafeStorage() {
  if (Platform.OS === 'web') {
    return getWebStorage();
  }
  let AsyncStorage: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> } | null = null;
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (_) {}

  return {
    getItem: async (name: string) => {
      try {
        if (AsyncStorage) return await AsyncStorage.getItem(name);
      } catch (_) {}
      return memoryFallback[name] ?? null;
    },
    setItem: (name: string, value: string) => {
      try {
        if (AsyncStorage) {
          return AsyncStorage.setItem(name, value).catch(() => {
            memoryFallback[name] = value;
          }) as Promise<void>;
        }
        memoryFallback[name] = value;
      } catch (_) {
        memoryFallback[name] = value;
      }
      return Promise.resolve();
    },
    removeItem: (name: string) => {
      try {
        if (AsyncStorage) {
          return AsyncStorage.removeItem(name).catch(() => {
            delete memoryFallback[name];
          }) as Promise<void>;
        }
        delete memoryFallback[name];
      } catch (_) {
        delete memoryFallback[name];
      }
      return Promise.resolve();
    },
  };
}
