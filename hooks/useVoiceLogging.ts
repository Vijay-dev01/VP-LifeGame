import { useCallback } from 'react';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';

export function useVoiceLogging() {
  const buddy = useBuddyOptional();

  const toggleListening = useCallback(() => {
    if (!buddy) return;
    buddy.toggleManualCommand();
  }, [buddy]);

  const startListening = useCallback(async () => {
    if (!buddy) return;
    await buddy.startManualCommand();
  }, [buddy]);

  const stopListening = useCallback(() => {
    buddy?.stopListening();
  }, [buddy]);

  const listening =
    buddy?.mode === 'commandListening' ||
    buddy?.mode === 'wakeListening' ||
    buddy?.mode === 'speaking';

  return {
    listening,
    lastTranscript: buddy?.lastTranscript ?? '',
    error: buddy?.error ?? null,
    toggleListening,
    startListening,
    stopListening,
  };
}
