import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useStore, type LifeLogIntent, type LifeLogMood } from '@/store';

function elapsedSince(isoStart: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000));
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function useTimer() {
  const activeTimer = useStore((s) => s.activeTimer);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (activeTimer) {
      setElapsedSeconds(elapsedSince(activeTimer.startTime));
    }
  }, [activeTimer]);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer, tick]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && activeTimer) tick();
    });
    return () => sub.remove();
  }, [activeTimer, tick]);

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
