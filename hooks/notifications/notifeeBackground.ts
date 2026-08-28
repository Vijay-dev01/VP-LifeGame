import * as Linking from 'expo-linking';
import { useStore } from '@/store';
import {
  TIMER_ACTION_PAUSE,
  TIMER_ACTION_STOP,
} from '@/utils/lifeLogTimerNotificationContent';

type NotifeeModule = typeof import('@notifee/react-native');

const buddyStopRef: { current: () => void | Promise<void> } = { current: () => undefined };
const timerRefreshRef: { current: () => void | Promise<void> } = { current: () => undefined };

export function registerBuddyBackgroundStop(fn: () => void | Promise<void>): void {
  buddyStopRef.current = fn;
}

export function registerTimerBackgroundRefresh(fn: () => void | Promise<void>): void {
  timerRefreshRef.current = fn;
}

async function handleTimerStop(): Promise<void> {
  useStore.getState().setPendingStopFromNotification(true);
  await Linking.openURL('vprime://life-log?action=stop').catch(() => undefined);
}

async function handleTimerPauseToggle(): Promise<void> {
  const state = useStore.getState();
  const timer = state.activeTimer;
  if (!timer) return;

  if (timer.pausedAt) state.resumeTimer();
  else state.pauseTimer();

  await timerRefreshRef.current();
}

export async function dispatchNotifeeBackgroundAction(
  actionId: string | undefined
): Promise<void> {
  if (!actionId) return;

  if (actionId === 'stop-buddy') {
    await buddyStopRef.current();
    return;
  }
  if (actionId === TIMER_ACTION_STOP) {
    await handleTimerStop();
    return;
  }
  if (actionId === TIMER_ACTION_PAUSE) {
    await handleTimerPauseToggle();
  }
}

export function dispatchNotifeeForegroundAction(actionId: string | undefined): void {
  void dispatchNotifeeBackgroundAction(actionId);
}

export function subscribeNotifeeForegroundEvents(notifee: NotifeeModule): () => void {
  return notifee.default.onForegroundEvent(({ type, detail }) => {
    if (type !== notifee.EventType.ACTION_PRESS) return;
    dispatchNotifeeForegroundAction(detail.pressAction?.id);
  });
}
