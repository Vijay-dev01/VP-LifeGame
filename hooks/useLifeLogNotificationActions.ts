import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Linking from 'expo-linking';
import { useStore } from '@/store';
import {
  updateLifeLogTimerNotification,
  TIMER_ACTION_PAUSE,
  TIMER_ACTION_STOP,
  TIMER_SOURCE,
} from './useLifeLogTimerNotification';

type ExpoNotifications = typeof import('expo-notifications');

function shouldSkip(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

export function useLifeLogNotificationActions() {
  useEffect(() => {
    if (shouldSkip()) return;

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
          Linking.openURL('vprime://life-log?action=stop').catch(() => {});
          return;
        }

        if (actionId === TIMER_ACTION_PAUSE && timer) {
          if (timer.pausedAt) {
            resumeTimer();
          } else {
            pauseTimer();
          }
          const updated = useStore.getState().activeTimer;
          if (updated) updateLifeLogTimerNotification(updated).catch(() => {});
        }
      });
    })();

    return () => sub?.remove();
  }, []);
}
