import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store';
import { consumeLegacyApiKey } from '@/utils/legacyAiKeyMigration';
import { getSecureApiKey, setSecureApiKey } from '@/utils/secureAiKey';

export function useAiSettings() {
  const aiSettings = useStore((s) => s.aiSettings);
  const setAiSettings = useStore((s) => s.setAiSettings);
  const [apiKey, setApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let key = await getSecureApiKey();
        if (!key) {
          const legacy = consumeLegacyApiKey();
          if (legacy) {
            await setSecureApiKey(legacy);
            key = legacy;
          }
        }
        if (!cancelled) {
          setApiKeyState(key);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    try {
      await setSecureApiKey(key);
    } catch {
      // SecureStore unavailable — keep in memory for session only
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setAiSettings({ enabled: !aiSettings.enabled });
  }, [aiSettings.enabled, setAiSettings]);

  return {
    enabled: aiSettings.enabled,
    apiKey,
    loaded,
    setApiKey,
    toggleEnabled,
  };
}
