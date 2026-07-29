import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { format } from 'date-fns';
import { useStore } from '@/store';
import {
  dismissLifeLogTimerNotification,
  showLifeLogTimerNotification,
  updateLifeLogTimerNotification,
  scheduleTimerRefreshChain,
  cancelTimerRefreshChain,
} from './useLifeLogTimerNotification';
import { getTimerElapsedSeconds } from '@/utils/lifeLog';

const NOTIFICATION_REFRESH_MS = 60_000;

export function useLifeLogTimerSync() {
  const activeTimer = useStore((s) => s.activeTimer);
  const forgotToStopState = useStore((s) => s.forgotToStopState);
  const prevTimerRef = useRef<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const forgotNudgeSentRef = useRef<string | null>(null);

  useEffect(() => {
    const timerKey = activeTimer
      ? `${activeTimer.startTime}|${activeTimer.category}|${activeTimer.title}|${activeTimer.pausedAt ?? ''}`
      : null;

    const prevKey = prevTimerRef.current;
    if (timerKey === prevKey) return;
    prevTimerRef.current = timerKey;

    if (activeTimer) {
      showLifeLogTimerNotification(activeTimer).catch(() => {});
      scheduleTimerRefreshChain(activeTimer).catch(() => {});
    } else if (prevKey !== null) {
      dismissLifeLogTimerNotification().catch(() => {});
      cancelTimerRefreshChain().catch(() => {});
    }
  }, [activeTimer]);

  useEffect(() => {
    if (!activeTimer) {
      forgotNudgeSentRef.current = null;
      return;
    }

    const elapsedHours = getTimerElapsedSeconds(activeTimer) / 3600;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (
      elapsedHours >= forgotToStopState.thresholdHours &&
      forgotNudgeSentRef.current !== today
    ) {
      forgotNudgeSentRef.current = today;
      (async () => {
        try {
          const Notifications = await import('expo-notifications');
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Still ${activeTimer.title}?`,
              body: 'Are you still going? Tap to check in.',
              data: { source: 'lifegame-smart', type: 'forgot-to-stop' },
              sound: false,
            },
            trigger: null,
          });
        } catch {
          // skip on unsupported platforms
        }
      })();
    }
  }, [activeTimer, forgotToStopState.thresholdHours]);

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
