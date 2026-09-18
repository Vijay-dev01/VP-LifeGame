import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store';
import { consumeLegacyApiKey } from '@/utils/legacyAiKeyMigration';
import { testApiKey } from '@/utils/aiInsights';
import { getSecureApiKey, setSecureApiKey } from '@/utils/secureAiKey';

export function useAiSettings() {
  const aiSettings = useStore((s) => s.aiSettings);
  const setAiSettings = useStore((s) => s.setAiSettings);
  const [apiKey, setApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

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
    setTestStatus('idle');
    setTestError(null);
    try {
      await setSecureApiKey(key);
    } catch {
      // SecureStore unavailable — keep in memory for session only
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setAiSettings({ enabled: !aiSettings.enabled });
  }, [aiSettings.enabled, setAiSettings]);

  const runKeyTest = useCallback(async () => {
    setTestStatus('testing');
    setTestError(null);
    const key = apiKey.trim() || (await getSecureApiKey());
    const result = await testApiKey(key);
    if (result.ok) {
      setTestStatus('ok');
      setTestError(null);
    } else {
      setTestStatus('error');
      setTestError(result.error);
    }
  }, [apiKey]);

  return {
    enabled: aiSettings.enabled,
    apiKey,
    loaded,
    setApiKey,
    toggleEnabled,
    testStatus,
    testError,
    runKeyTest,
  };
}

export type AiSettingsStatus =
  | 'disabled'
  | 'key_missing'
  | 'needs_reflections'
  | 'ready'
  | 'loading'
  | 'error';

export function getAiSettingsStatus(opts: {
  enabled: boolean;
  apiKey: string;
  loaded: boolean;
  reflectionCount: number;
  testStatus: 'idle' | 'testing' | 'ok' | 'error';
  testError: string | null;
}): { status: AiSettingsStatus; label: string } {
  if (!opts.enabled) {
    return { status: 'disabled', label: 'Off' };
  }
  if (!opts.loaded) {
    return { status: 'loading', label: 'Loading…' };
  }
  if (!opts.apiKey.trim()) {
    return { status: 'key_missing', label: 'Key missing' };
  }
  if (opts.reflectionCount === 0) {
    return { status: 'needs_reflections', label: 'Needs reflections' };
  }
  if (opts.testStatus === 'testing') {
    return { status: 'loading', label: 'Testing…' };
  }
  if (opts.testStatus === 'error' && opts.testError) {
    return { status: 'error', label: 'API error' };
  }
  if (opts.testStatus === 'ok') {
    return { status: 'ready', label: 'Connected' };
  }
  return { status: 'ready', label: 'Ready' };
}
