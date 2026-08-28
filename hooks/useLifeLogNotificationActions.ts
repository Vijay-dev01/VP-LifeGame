import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useStore } from '@/store';
import { shouldSkipNotificationHandlers } from '@/hooks/notifications/shared';
import {
  updateLifeLogTimerNotification,
  TIMER_ACTION_PAUSE,
  TIMER_ACTION_STOP,
  TIMER_SOURCE,
} from './useLifeLogTimerNotification';
import { updateLifeLogTimerForegroundNotification } from './useLifeLogTimerForegroundService';

type ExpoNotifications = typeof import('expo-notifications');

async function refreshTimerNotification(): Promise<void> {
  const timer = useStore.getState().activeTimer;
  if (!timer) return;

  if (Platform.OS === 'android') {
    await updateLifeLogTimerForegroundNotification(timer).catch(() => undefined);
  }
  await updateLifeLogTimerNotification(timer).catch(() => undefined);
}

export function useLifeLogNotificationActions() {
  useEffect(() => {
    if (shouldSkipNotificationHandlers()) return;

    let sub: { remove: () => void } | null = null;

    (async () => {
      const Notifications: ExpoNotifications = await import('expo-notifications');
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.source !== TIMER_SOURCE) return;

        const actionId = response.actionIdentifier;
        const { pauseTimer, resumeTimer, setPendingStopFromNotification } = useStore.getState();
        const timer = useStore.getState().activeTimer;

        if (actionId === TIMER_ACTION_STOP) {
          setPendingStopFromNotification(true);
          Linking.openURL('vprime://life-log?action=stop').catch(() => undefined);
          return;
        }

        if (actionId === TIMER_ACTION_PAUSE && timer) {
          if (timer.pausedAt) resumeTimer();
          else pauseTimer();
          void refreshTimerNotification();
        }
      });
    })();

    return () => sub?.remove();
  }, []);
}
