import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { format } from 'date-fns';
import { useStore } from '@/store';
import { stopBuddyForegroundService } from '@/hooks/useBuddyAndroidService';
import {
  dismissLifeLogTimerNotification,
  showLifeLogTimerNotification,
  updateLifeLogTimerNotification,
} from './useLifeLogTimerNotification';
import {
  cleanupNotifeeForegroundService,
  isLifeLogTimerForegroundServiceAvailable,
  showLifeLogTimerForegroundNotification,
  stopLifeLogTimerForegroundService,
  updateLifeLogTimerForegroundNotification,
} from './useLifeLogTimerForegroundService';
import { getTimerElapsedSeconds } from '@/utils/lifeLog';

const TICK_MS = 1_000;
const IOS_BACKGROUND_REFRESH_MS = 60_000;
const MAX_FGS_LAUNCH_FAILURES = 2;

function waitForActiveAppState(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();

  return new Promise((resolve) => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sub.remove();
        resolve();
      }
    });
  });
}

export function useLifeLogTimerSync() {
  const activeTimer = useStore((s) => s.activeTimer);
  const forgotToStopState = useStore((s) => s.forgotToStopState);
  const prevTimerRef = useRef<string | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const forgotNudgeSentRef = useRef<string | null>(null);
  const useAndroidFgsRef = useRef(false);
  const launchCleanupDoneRef = useRef(false);
  const fgsLaunchFailuresRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android' || launchCleanupDoneRef.current) return;

    launchCleanupDoneRef.current = true;
    void cleanupNotifeeForegroundService();
  }, []);

  useEffect(() => {
    const timerKey = activeTimer
      ? `${activeTimer.startTime}|${activeTimer.category}|${activeTimer.title}|${activeTimer.pausedAt ?? ''}`
      : null;

    const prevKey = prevTimerRef.current;
    if (timerKey === prevKey) return;
    prevTimerRef.current = timerKey;

    let cancelled = false;

    void (async () => {
      if (activeTimer) {
        if (Platform.OS === 'android') {
          await waitForActiveAppState();
          if (cancelled) return;

          await stopBuddyForegroundService({ keepSettings: true });

          const useFgs = await isLifeLogTimerForegroundServiceAvailable();
          useAndroidFgsRef.current = useFgs;

          if (useFgs) {
            const ok = await showLifeLogTimerForegroundNotification(activeTimer);
            if (cancelled) return;

            if (!ok) {
              fgsLaunchFailuresRef.current += 1;
              useAndroidFgsRef.current = false;
              await showLifeLogTimerNotification(activeTimer);

              if (fgsLaunchFailuresRef.current >= MAX_FGS_LAUNCH_FAILURES) {
                useStore.getState().discardTimer();
              }
            } else {
              fgsLaunchFailuresRef.current = 0;
            }
            return;
          }
        }

        await showLifeLogTimerNotification(activeTimer);
      } else if (prevKey !== null) {
        await stopLifeLogTimerForegroundService();
        await dismissLifeLogTimerNotification();
        useAndroidFgsRef.current = false;
        fgsLaunchFailuresRef.current = 0;
      }
    })();

    return () => {
      cancelled = true;
    };
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
      void (async () => {
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
    const clearTickInterval = () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };

    const tick = () => {
      const timer = useStore.getState().activeTimer;
      if (!timer) return;

      if (useAndroidFgsRef.current) {
        updateLifeLogTimerForegroundNotification(timer).catch(() => undefined);
        return;
      }

      if (AppState.currentState === 'active') {
        updateLifeLogTimerNotification(timer).catch(() => undefined);
      }
    };

    const getIntervalMs = () => {
      if (useAndroidFgsRef.current) return TICK_MS;
      return AppState.currentState === 'active' ? TICK_MS : IOS_BACKGROUND_REFRESH_MS;
    };

    const startTickInterval = () => {
      clearTickInterval();
      if (!useStore.getState().activeTimer) return;
      tick();
      tickIntervalRef.current = setInterval(tick, getIntervalMs());
    };

    const handleAppState = (_state: AppStateStatus) => {
      if (!useStore.getState().activeTimer || useAndroidFgsRef.current) return;
      startTickInterval();
    };

    if (activeTimer) {
      startTickInterval();
    } else {
      clearTickInterval();
    }

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      clearTickInterval();
    };
  }, [activeTimer]);
}
