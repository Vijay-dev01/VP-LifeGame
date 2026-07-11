import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useStore } from '@/store';
import { parseVoiceCommand, VOICE_CONTEXTUAL_STRINGS } from '@/utils/voiceCommands';

function shouldSkip(): boolean {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

export function useVoiceLogging() {
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const activeTimer = useStore((s) => s.activeTimer);
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const moduleRef = useRef<typeof import('expo-speech-recognition') | null>(null);

  useEffect(() => {
    if (shouldSkip()) return;
    import('expo-speech-recognition')
      .then((m) => {
        moduleRef.current = m;
      })
      .catch(() => setError('Voice not available'));
  }, []);

  const handleResult = useCallback(
    (transcript: string) => {
      setLastTranscript(transcript);
      const cmd = parseVoiceCommand(transcript);
      if (!cmd) return;

      if (cmd.action === 'start') {
        if (!activeTimer) startTimer(cmd.category, cmd.title);
      } else if (cmd.action === 'stop' && activeTimer) {
        stopTimer({ title: activeTimer.title });
      }
    },
    [activeTimer, startTimer, stopTimer]
  );

  const startListening = useCallback(async () => {
    if (shouldSkip()) {
      setError('Voice requires a dev build');
      return;
    }
    const mod = moduleRef.current;
    if (!mod) {
      setError('Voice module loading...');
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

    setError(null);
    setListening(true);

    const sub = mod.ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results?.[0]?.transcript ?? '';
      if (event.isFinal && transcript) {
        handleResult(transcript);
        mod.ExpoSpeechRecognitionModule.stop();
        setListening(false);
      }
    });

    const errSub = mod.ExpoSpeechRecognitionModule.addListener('error', () => {
      setListening(false);
      setError('Could not recognize speech');
    });

    mod.ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      continuous: false,
      interimResults: true,
      contextualStrings: VOICE_CONTEXTUAL_STRINGS,
    });

    return () => {
      sub.remove();
      errSub.remove();
    };
  }, [handleResult]);

  const stopListening = useCallback(() => {
    const mod = moduleRef.current;
    if (mod) mod.ExpoSpeechRecognitionModule.stop();
    setListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  return { listening, lastTranscript, error, toggleListening, startListening, stopListening };
}
