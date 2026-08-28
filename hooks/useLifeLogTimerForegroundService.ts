import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { ActiveTimer } from '@/store';
import {
  buildLifeLogTimerNotificationContent,
  TIMER_ACTION_PAUSE,
  TIMER_ACTION_STOP,
  TIMER_CHANNEL_ID,
  TIMER_NOTIFICATION_COLOR,
  TIMER_NOTIFICATION_ID,
} from '@/utils/lifeLogTimerNotificationContent';
import {
  registerTimerBackgroundRefresh,
  subscribeNotifeeForegroundEvents,
} from '@/hooks/notifications/notifeeBackground';

type NotifeeModule = typeof import('@notifee/react-native');

let notifeeModule: NotifeeModule | null = null;
let loadAttempted = false;
let channelReady = false;
let foregroundUnsub: (() => void) | undefined;

async function loadNotifee(): Promise<NotifeeModule | null> {
  if (loadAttempted) return notifeeModule;
  loadAttempted = true;

  if (Platform.OS !== 'android' || isRunningInExpoGo()) {
    return null;
  }

  try {
    notifeeModule = await import('@notifee/react-native');
    return notifeeModule;
  } catch {
    notifeeModule = null;
    return null;
  }
}

async function ensureChannel(notifee: NotifeeModule): Promise<void> {
  if (channelReady) return;
  await notifee.default.createChannel({
    id: TIMER_CHANNEL_ID,
    name: 'Life Log timer',
    importance: notifee.AndroidImportance.LOW,
    vibration: false,
  });
  channelReady = true;
}

function buildAndroidNotification(timer: ActiveTimer, notifee: NotifeeModule) {
  const content = buildLifeLogTimerNotificationContent(timer);

  return {
    id: TIMER_NOTIFICATION_ID,
    title: content.title,
    body: content.body,
    android: {
      channelId: TIMER_CHANNEL_ID,
      color: TIMER_NOTIFICATION_COLOR,
      asForegroundService: true,
      foregroundServiceTypes: [
        notifee.AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      ],
      ongoing: true,
      onlyAlertOnce: true,
      pressAction: { id: 'default' },
      actions: [
        {
          title: content.pauseActionLabel,
          pressAction: { id: TIMER_ACTION_PAUSE },
        },
        {
          title: 'STOP',
          pressAction: { id: TIMER_ACTION_STOP },
        },
      ],
    },
  };
}

export async function cleanupNotifeeForegroundService(): Promise<void> {
  const notifee = await loadNotifee();
  if (!notifee) return;
  await notifee.default.stopForegroundService().catch(() => undefined);
}

export async function isLifeLogTimerForegroundServiceAvailable(): Promise<boolean> {
  const notifee = await loadNotifee();
  return notifee !== null;
}

export async function showLifeLogTimerForegroundNotification(
  timer: ActiveTimer
): Promise<boolean> {
  const notifee = await loadNotifee();
  if (!notifee) return false;

  try {
    await ensureChannel(notifee);

    const settings = await notifee.default.requestPermission();
    if (settings.authorizationStatus === 0) return false;

    if (!foregroundUnsub) {
      foregroundUnsub = subscribeNotifeeForegroundEvents(notifee);
    }

    registerTimerBackgroundRefresh(async () => {
      const { useStore } = await import('@/store');
      const current = useStore.getState().activeTimer;
      if (current) await showLifeLogTimerForegroundNotification(current);
    });

    await notifee.default.displayNotification(buildAndroidNotification(timer, notifee));
    return true;
  } catch {
    return false;
  }
}

export async function updateLifeLogTimerForegroundNotification(
  timer: ActiveTimer
): Promise<void> {
  await showLifeLogTimerForegroundNotification(timer);
}

export async function stopLifeLogTimerForegroundService(): Promise<void> {
  const notifee = await loadNotifee();
  if (!notifee) return;

  await notifee.default.stopForegroundService().catch(() => undefined);
  await notifee.default.cancelNotification(TIMER_NOTIFICATION_ID).catch(() => undefined);
}
