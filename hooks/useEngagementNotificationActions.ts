import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Linking from 'expo-linking';
import { format } from 'date-fns';
import { useStore } from '@/store';

const SMART_SOURCE = 'lifegame-smart';
const PLAN_START_ACTION = 'PLAN_START';

function shouldSkip(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

export function useEngagementNotificationActions() {
  useEffect(() => {
    if (shouldSkip()) return;

    let sub: { remove: () => void } | null = null;

    (async () => {
      const Notifications = await import('expo-notifications');
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.source !== SMART_SOURCE) return;

        const type = data?.type as string | undefined;
        const actionId = response.actionIdentifier;

        if (type === 'plan-evening') {
          Linking.openURL('vprime://life-log?action=plan').catch(() => {});
          return;
        }

        if (type === 'plan-morning' && actionId === PLAN_START_ACTION) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const plans = useStore.getState().getPlanForDate(today);
          const first = plans.find((p) => !p.done) ?? plans[0];
          if (first && !useStore.getState().activeTimer) {
            useStore.getState().startTimer(first.category, first.title);
            useStore.getState().markPlanItemDone(today, first.id);
          }
          Linking.openURL('vprime://life-log').catch(() => {});
          return;
        }

        if (type === 'reflection-evening') {
          Linking.openURL('vprime://life-log').catch(() => {});
        }

        if (type === 'forgot-to-stop') {
          Linking.openURL('vprime://life-log').catch(() => {});
        }
      });
    })();

    return () => sub?.remove();
  }, []);
}

export { PLAN_START_ACTION };
