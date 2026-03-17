import { Platform } from 'react-native';

let memoryFallback: Record<string, string> = {};

const DEBOUNCE_MS = 400;
const pending: Record<string, { value: string; timer: ReturnType<typeof setTimeout> }> = {};

function debouncedSetItem(
  realSetItem: (name: string, value: string) => Promise<void>,
  name: string,
  value: string
): Promise<void> {
  if (pending[name]) clearTimeout(pending[name].timer);
  return new Promise((resolve) => {
    pending[name] = {
      value,
      timer: setTimeout(() => {
        const { value: v } = pending[name];
        delete pending[name];
        realSetItem(name, v).then(resolve);
      }, DEBOUNCE_MS),
    };
  });
}

function getWebStorage() {
  const realSetItem = (name: string, value: string) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(name, value);
        return Promise.resolve();
      }
    } catch (_) {}
    memoryFallback[name] = value;
    return Promise.resolve();
  };
  return {
    getItem: async (name: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(name);
        }
      } catch (_) {}
      return memoryFallback[name] ?? null;
    },
    setItem: (name: string, value: string) =>
      debouncedSetItem(realSetItem, name, value),
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

  const realSetItem = (name: string, value: string) => {
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
  };
  return {
    getItem: async (name: string) => {
      try {
        if (AsyncStorage) return await AsyncStorage.getItem(name);
      } catch (_) {}
      return memoryFallback[name] ?? null;
    },
    setItem: (name: string, value: string) =>
      debouncedSetItem(realSetItem, name, value),
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
