import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { ActiveTimer } from '@/store';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { formatTimerElapsed, getTimerElapsedSeconds } from '@/utils/lifeLog';

export const TIMER_NOTIFICATION_ID = 'lifelog-active-timer';
export const TIMER_SOURCE = 'lifelog-timer';
const CHANNEL_ID = 'life-log-timer';

type ExpoNotifications = typeof import('expo-notifications');

function shouldSkipNotificationsModule(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

let notificationsImportPromise: Promise<ExpoNotifications | null> | null = null;

async function getNotificationsModule(): Promise<ExpoNotifications | null> {
  if (shouldSkipNotificationsModule()) return null;
  if (!notificationsImportPromise) {
    notificationsImportPromise = import('expo-notifications').then((m) => m);
  }
  return notificationsImportPromise;
}

async function ensureTimerChannel(Notifications: ExpoNotifications): Promise<boolean> {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Life Log timer',
      importance: Notifications.AndroidImportance.LOW,
      sound: undefined,
      vibrationPattern: [],
    });
  }
  return true;
}

function buildNotificationBody(timer: ActiveTimer): string {
  const elapsed = formatTimerElapsed(getTimerElapsedSeconds(timer.startTime));
  const categoryLabel = getCategoryById(timer.category)?.label ?? timer.category;
  return `${timer.title} · ${categoryLabel} · ${elapsed}`;
}

export async function showLifeLogTimerNotification(timer: ActiveTimer): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const ready = await ensureTimerChannel(Notifications);
  if (!ready) return;

  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIFICATION_ID,
    content: {
      title: 'Life Log · Tracking',
      body: buildNotificationBody(timer),
      data: { source: TIMER_SOURCE },
      sound: false,
      sticky: true,
      ...(Platform.OS === 'android'
        ? {
            channelId: CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.LOW,
          }
        : {}),
    },
    trigger: null,
  });
}

export async function updateLifeLogTimerNotification(timer: ActiveTimer): Promise<void> {
  await showLifeLogTimerNotification(timer);
}

export async function dismissLifeLogTimerNotification(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // Notification may not be presented
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // Notification may not be scheduled
  }
}
