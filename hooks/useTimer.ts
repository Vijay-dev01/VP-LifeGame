import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useStore, type LifeLogIntent, type LifeLogMood } from '@/store';
import { formatTimerElapsed, getTimerElapsedSeconds } from '@/utils/lifeLog';

export function formatElapsed(seconds: number): string {
  return formatTimerElapsed(seconds);
}

function useForegroundTick(enabled: boolean): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const bump = () => setTick((t) => t + 1);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId) return;
      intervalId = setInterval(bump, 1000);
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        bump();
        startInterval();
      } else {
        stopInterval();
      }
    };

    bump();
    if (AppState.currentState === 'active') startInterval();

    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      stopInterval();
      sub.remove();
    };
  }, [enabled]);
}

export function useTimer() {
  const activeTimer = useStore((s) => s.activeTimer);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);

  useForegroundTick(!!activeTimer);

  const elapsedSeconds = activeTimer
    ? getTimerElapsedSeconds(activeTimer.startTime)
    : 0;

  const start = useCallback(
    (category: string, title?: string) => {
      startTimer(category, title);
    },
    [startTimer]
  );

  const stop = useCallback(
    (overrides?: {
      title?: string;
      notes?: string;
      mood?: LifeLogMood;
      energyLevel?: number;
      intentType?: LifeLogIntent;
    }) => {
      return stopTimer(overrides);
    },
    [stopTimer]
  );

  return {
    activeTimer,
    elapsedSeconds,
    isRunning: !!activeTimer,
    elapsedFormatted: formatElapsed(elapsedSeconds),
    start,
    stop,
  };
}
