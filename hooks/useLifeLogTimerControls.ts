import { useCallback } from 'react';
import { useStore } from '@/store';

/** Timer controls without 1Hz tick — use LifeLogTimerSection for display. */
export function useLifeLogTimerControls() {
  const activeTimer = useStore((s) => s.activeTimer);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);

  const isRunning = !!activeTimer;

  const start = useCallback(
    (category: string, title?: string) => {
      startTimer(category, title);
    },
    [startTimer]
  );

  const stop = useCallback(
    (overrides?: Parameters<typeof stopTimer>[0]) => stopTimer(overrides),
    [stopTimer]
  );

  return { activeTimer, isRunning, start, stop };
}
