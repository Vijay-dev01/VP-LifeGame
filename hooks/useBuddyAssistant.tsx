import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useStore } from '@/store';
import { executeBuddyCommand, processBuddyTranscript } from '@/services/buddyExecutor';
import {
  BUDDY_CONTEXTUAL_STRINGS,
  containsWakePhrase,
} from '@/utils/buddyCommands';
import { isBuddySpeaking, speakBuddy, stopBuddySpeech } from '@/utils/buddySpeech';
import {
  startBuddyBackgroundSession,
  stopBuddyBackgroundSession,
} from '@/utils/buddyBackgroundSession';
import { useBuddyAndroidService } from '@/hooks/useBuddyAndroidService';
import { stopLifeLogTimerForegroundService } from '@/hooks/useLifeLogTimerForegroundService';

export type BuddyMode = 'off' | 'wakeListening' | 'commandListening' | 'speaking';

export type LockScreenStatus = 'off' | 'listening' | 'needs-mic' | 'unavailable' | 'starting';

export interface BuddyContextValue {
  mode: BuddyMode;
  lastTranscript: string;
  error: string | null;
  statusLabel: string;
  lockScreenStatus: LockScreenStatus;
  lockScreenStatusLabel: string | null;
  enabled: boolean;
  startManualCommand: () => Promise<void>;
  stopListening: () => void;
  toggleManualCommand: () => void;
}

type SpeechModule = typeof import('expo-speech-recognition');

const BuddyContext = createContext<BuddyContextValue | null>(null);

function shouldSkipNativeVoice(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

export function BuddyProvider({ children }: { children: React.ReactNode }) {
  const buddySettings = useStore((s) => s.buddySettings);
  const [mode, setMode] = useState<BuddyMode>('off');
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockScreenStatus, setLockScreenStatus] = useState<LockScreenStatus>('off');
  const moduleRef = useRef<SpeechModule | null>(null);
  const listenersRef = useRef<{ remove: () => void }[]>([]);
  const modeRef = useRef<BuddyMode>('off');
  const wakeTriggeredRef = useRef(false);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockScreenStartingRef = useRef(false);

  const {
    startAndroidService,
    stopAndroidService,
    serviceActive,
    lockScreenError,
    notifeeAvailable,
  } = useBuddyAndroidService();

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const ensureSpeechModuleReady = useCallback(async (): Promise<boolean> => {
    if (shouldSkipNativeVoice()) return false;
    if (moduleRef.current) return true;
    try {
      moduleRef.current = await import('expo-speech-recognition');
      return true;
    } catch {
      setError('Voice not available');
      return false;
    }
  }, []);

  useEffect(() => {
    if (shouldSkipNativeVoice()) return;
    ensureSpeechModuleReady();
  }, [ensureSpeechModuleReady]);

  const clearListeners = useCallback(() => {
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    clearListeners();
    moduleRef.current?.ExpoSpeechRecognitionModule.stop();
  }, [clearListeners]);

  const startWakeListeningRef = useRef<() => Promise<void>>(async () => undefined);
  const resumeAfterSpeechRef = useRef<() => void>(() => undefined);

  const handleCommandTranscript = useCallback(
    (transcript: string) => {
      setLastTranscript(transcript);
      stopRecognition();
      const result = processBuddyTranscript(transcript, { allowWake: false });
      if (!result) {
        speakBuddy("Sorry, I didn't understand that.");
        setMode('speaking');
        setTimeout(() => resumeAfterSpeechRef.current(), 2500);
        return;
      }
      setMode('speaking');
      speakBuddy(result.reply);
      setTimeout(() => resumeAfterSpeechRef.current(), Math.max(2000, result.reply.length * 60));
    },
    [stopRecognition]
  );

  const resumeAfterSpeech = useCallback(() => {
    if (!buddySettings.enabled) {
      setMode('off');
      return;
    }
    if (buddySettings.lockScreenListen && Platform.OS === 'android' && serviceActive) {
      startWakeListeningRef.current();
      return;
    }
    setMode('off');
  }, [buddySettings.enabled, buddySettings.lockScreenListen, serviceActive]);

  useEffect(() => {
    resumeAfterSpeechRef.current = resumeAfterSpeech;
  }, [resumeAfterSpeech]);

  const scheduleWakeListenRetry = useCallback((delayMs = 2000) => {
    setTimeout(() => {
      const settings = useStore.getState().buddySettings;
      if (
        settings.enabled &&
        settings.lockScreenListen &&
        Platform.OS === 'android' &&
        modeRef.current === 'off' &&
        !isBuddySpeaking()
      ) {
        startWakeListeningRef.current();
      }
    }, delayMs);
  }, []);

  const startCommandListening = useCallback(async () => {
    const ready = await ensureSpeechModuleReady();
    const mod = moduleRef.current;
    if (!ready || !mod || shouldSkipNativeVoice()) {
      setError('Voice requires a dev build');
      return;
    }

    const available = await mod.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!available) {
      setError('Speech recognition unavailable');
      return;
    }

    const perms = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perms.granted) {
      setError('Microphone permission required');
      return;
    }

    stopRecognition();
    setError(null);
    setMode('commandListening');
    wakeTriggeredRef.current = false;

    const resultSub = mod.ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results?.[0]?.transcript ?? '';
      if (event.isFinal && transcript.trim()) {
        handleCommandTranscript(transcript.trim());
      }
    });

    const errSub = mod.ExpoSpeechRecognitionModule.addListener('error', () => {
      setError('Could not recognize speech');
      stopRecognition();
      resumeAfterSpeechRef.current();
    });

    listenersRef.current = [resultSub, errSub];

    mod.ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      continuous: false,
      interimResults: true,
      contextualStrings: BUDDY_CONTEXTUAL_STRINGS,
    });

    commandTimeoutRef.current = setTimeout(() => {
      if (modeRef.current === 'commandListening') {
        stopRecognition();
        resumeAfterSpeechRef.current();
      }
    }, 8000);
  }, [ensureSpeechModuleReady, handleCommandTranscript, stopRecognition]);

  const triggerWake = useCallback(() => {
    if (wakeTriggeredRef.current) return;
    wakeTriggeredRef.current = true;
    stopRecognition();
    setMode('speaking');
    const wakeResult = executeBuddyCommand({ type: 'wake' });
    speakBuddy(wakeResult.reply);
    setTimeout(() => {
      startCommandListening();
    }, 1800);
  }, [startCommandListening, stopRecognition]);

  const startWakeListening = useCallback(async () => {
    const ready = await ensureSpeechModuleReady();
    const mod = moduleRef.current;
    if (!ready || !mod || shouldSkipNativeVoice()) return;

    const available = await mod.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!available) return;

    const perms = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perms.granted) {
      setLockScreenStatus('needs-mic');
      return;
    }

    stopRecognition();
    setError(null);
    setMode('wakeListening');
    setLockScreenStatus('listening');
    wakeTriggeredRef.current = false;

    const resultSub = mod.ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results?.[0]?.transcript ?? '';
      if (!transcript) return;
      if (containsWakePhrase(transcript)) {
        triggerWake();
        return;
      }
      if (event.isFinal && containsWakePhrase(transcript)) {
        triggerWake();
      }
    });

    const errSub = mod.ExpoSpeechRecognitionModule.addListener('error', () => {
      stopRecognition();
      setMode('off');
      scheduleWakeListenRetry();
    });

    const endSub = mod.ExpoSpeechRecognitionModule.addListener('end', () => {
      const settings = useStore.getState().buddySettings;
      if (
        settings.enabled &&
        settings.lockScreenListen &&
        modeRef.current === 'wakeListening' &&
        !isBuddySpeaking()
      ) {
        scheduleWakeListenRetry(500);
      }
    });

    listenersRef.current = [resultSub, errSub, endSub];

    mod.ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      continuous: true,
      interimResults: true,
      requiresOnDeviceRecognition: Platform.OS === 'android',
      contextualStrings: BUDDY_CONTEXTUAL_STRINGS,
    });
  }, [ensureSpeechModuleReady, scheduleWakeListenRetry, stopRecognition, triggerWake]);

  useEffect(() => {
    startWakeListeningRef.current = startWakeListening;
  }, [startWakeListening]);

  const stopListening = useCallback(() => {
    stopBuddySpeech();
    stopRecognition();
    setMode('off');
  }, [stopRecognition]);

  const stopLockScreenMode = useCallback(async () => {
    stopListening();
    await stopBuddyBackgroundSession();
    await stopAndroidService({ keepSettings: true });
    setLockScreenStatus('off');
    lockScreenStartingRef.current = false;
  }, [stopAndroidService, stopListening]);

  const startLockScreenMode = useCallback(async () => {
    if (
      !buddySettings.enabled ||
      !buddySettings.lockScreenListen ||
      Platform.OS !== 'android' ||
      lockScreenStartingRef.current
    ) {
      return;
    }

    lockScreenStartingRef.current = true;
    setLockScreenStatus('starting');

    const speechReady = await ensureSpeechModuleReady();
    if (!speechReady) {
      setLockScreenStatus('unavailable');
      lockScreenStartingRef.current = false;
      return;
    }

    const audio = await startBuddyBackgroundSession();
    if (!audio.ok) {
      setError(audio.error ?? 'Could not start background mic');
      setLockScreenStatus('needs-mic');
      lockScreenStartingRef.current = false;
      return;
    }

    await stopLifeLogTimerForegroundService();

    const service = await startAndroidService();
    if (!service.ok) {
      await stopBuddyBackgroundSession();
      setError(service.error ?? lockScreenError ?? 'Lock screen unavailable');
      setLockScreenStatus('unavailable');
      lockScreenStartingRef.current = false;
      return;
    }

    await startWakeListening();
    lockScreenStartingRef.current = false;
  }, [
    buddySettings.enabled,
    buddySettings.lockScreenListen,
    ensureSpeechModuleReady,
    lockScreenError,
    startAndroidService,
    startWakeListening,
  ]);

  const startManualCommand = useCallback(async () => {
    if (!buddySettings.enabled) {
      setError('Enable Hey Buddy in Analytics settings');
      return;
    }
    if (isBuddySpeaking()) {
      stopBuddySpeech();
      await startCommandListening();
      return;
    }
    await startCommandListening();
  }, [buddySettings.enabled, startCommandListening]);

  const toggleManualCommand = useCallback(() => {
    if (mode === 'commandListening' || mode === 'wakeListening') {
      stopListening();
    } else {
      startManualCommand();
    }
  }, [mode, startManualCommand, stopListening]);

  useEffect(() => {
    if (!buddySettings.enabled) {
      stopLockScreenMode();
      stopAndroidService({ keepSettings: true });
      return;
    }

    if (buddySettings.lockScreenListen && Platform.OS === 'android') {
      startLockScreenMode();
    } else {
      stopLockScreenMode();
    }
  }, [
    buddySettings.enabled,
    buddySettings.lockScreenListen,
    startLockScreenMode,
    stopLockScreenMode,
    stopAndroidService,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const settings = useStore.getState().buddySettings;
      if (!settings.enabled || !settings.lockScreenListen || Platform.OS !== 'android') return;

      if (nextState === 'background' || nextState === 'inactive') {
        startBuddyBackgroundSession().then(() => {
          if (modeRef.current === 'wakeListening') {
            scheduleWakeListenRetry(500);
          }
        });
        return;
      }

      if (nextState === 'active' && modeRef.current === 'off' && !isBuddySpeaking()) {
        scheduleWakeListenRetry(300);
      }
    });

    return () => sub.remove();
  }, [scheduleWakeListenRetry]);

  useEffect(() => {
    return () => {
      stopListening();
      stopBuddyBackgroundSession();
      stopAndroidService({ keepSettings: true });
    };
  }, [stopAndroidService, stopListening]);

  const statusLabel = useMemo(() => {
    switch (mode) {
      case 'wakeListening':
        return 'Say "Hey Buddy"…';
      case 'commandListening':
        return 'Listening…';
      case 'speaking':
        return 'Speaking…';
      default:
        return 'Tap to talk';
    }
  }, [mode]);

  const lockScreenStatusLabel = useMemo(() => {
    if (!buddySettings.lockScreenListen || Platform.OS !== 'android') return null;

    if (lockScreenError || notifeeAvailable === false) {
      return 'Lock screen unavailable — rebuild app';
    }

    switch (lockScreenStatus) {
      case 'listening':
        return 'Listening…';
      case 'needs-mic':
        return 'Needs mic permission';
      case 'unavailable':
        return 'Lock screen unavailable — rebuild app';
      case 'starting':
        return 'Starting…';
      default:
        if (mode === 'wakeListening') return 'Listening…';
        return null;
    }
  }, [
    buddySettings.lockScreenListen,
    lockScreenError,
    lockScreenStatus,
    mode,
    notifeeAvailable,
  ]);

  const value = useMemo<BuddyContextValue>(
    () => ({
      mode,
      lastTranscript,
      error,
      statusLabel,
      lockScreenStatus,
      lockScreenStatusLabel,
      enabled: buddySettings.enabled,
      startManualCommand,
      stopListening,
      toggleManualCommand,
    }),
    [
      mode,
      lastTranscript,
      error,
      statusLabel,
      lockScreenStatus,
      lockScreenStatusLabel,
      buddySettings.enabled,
      startManualCommand,
      stopListening,
      toggleManualCommand,
    ]
  );

  return <BuddyContext.Provider value={value}>{children}</BuddyContext.Provider>;
}

export function useBuddyOptional(): BuddyContextValue | null {
  return useContext(BuddyContext);
}
