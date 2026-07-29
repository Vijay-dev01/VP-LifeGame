import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { format } from 'date-fns';
import { useStore } from '@/store';
import {
  shouldSkipNotificationHandlers,
  SMART_NOTIFICATION_SOURCE,
} from '@/hooks/notifications/shared';

const SMART_SOURCE = SMART_NOTIFICATION_SOURCE;
const PLAN_START_ACTION = 'PLAN_START';

export function useEngagementNotificationActions() {
  useEffect(() => {
    if (shouldSkipNotificationHandlers()) return;

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

        if (type === 'plan-morning' && (data?.openPlan || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER)) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const plans = useStore.getState().getPlanForDate(today);
          if (!plans.length || data?.openPlan) {
            Linking.openURL('vprime://life-log?action=plan').catch(() => {});
            return;
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
