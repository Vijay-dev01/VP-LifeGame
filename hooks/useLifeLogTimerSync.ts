import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useStore } from '@/store';
import {
  dismissLifeLogTimerNotification,
  showLifeLogTimerNotification,
  updateLifeLogTimerNotification,
} from './useLifeLogTimerNotification';

const NOTIFICATION_REFRESH_MS = 60_000;

export function useLifeLogTimerSync() {
  const activeTimer = useStore((s) => s.activeTimer);
  const prevTimerRef = useRef<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timerKey = activeTimer
      ? `${activeTimer.startTime}|${activeTimer.category}|${activeTimer.title}`
      : null;

    const prevKey = prevTimerRef.current;
    if (timerKey === prevKey) return;
    prevTimerRef.current = timerKey;

    if (activeTimer) {
      showLifeLogTimerNotification(activeTimer).catch(() => {});
    } else if (prevKey !== null) {
      dismissLifeLogTimerNotification().catch(() => {});
    }
  }, [activeTimer]);

  useEffect(() => {
    const clearRefreshInterval = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };

    const startRefreshInterval = () => {
      clearRefreshInterval();
      if (!activeTimer || AppState.currentState !== 'active') return;

      refreshIntervalRef.current = setInterval(() => {
        const timer = useStore.getState().activeTimer;
        if (timer) {
          updateLifeLogTimerNotification(timer).catch(() => {});
        }
      }, NOTIFICATION_REFRESH_MS);
    };

    const handleAppState = (state: AppStateStatus) => {
      const timer = useStore.getState().activeTimer;
      if (state === 'active' && timer) {
        updateLifeLogTimerNotification(timer).catch(() => {});
        startRefreshInterval();
      } else {
        clearRefreshInterval();
      }
    };

    handleAppState(AppState.currentState);

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      clearRefreshInterval();
    };
  }, [activeTimer]);
}
