import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { ActiveTimer } from '@/store';
import { formatTimerElapsed, getTimerElapsedSeconds, isTimerPaused } from '@/utils/lifeLog';

export const TIMER_NOTIFICATION_ID = 'lifelog-active-timer';
export const TIMER_CATEGORY_ID = 'lifelog-timer-actions';
export const TIMER_SOURCE = 'lifelog-timer';
export const TIMER_ACTION_STOP = 'TIMER_STOP';
export const TIMER_ACTION_PAUSE = 'TIMER_PAUSE';
export const TIMER_REFRESH_PREFIX = 'timer-refresh-';
const CHANNEL_ID = 'life-log-timer';

type ExpoNotifications = typeof import('expo-notifications');

function shouldSkipNotificationsModule(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

let notificationsImportPromise: Promise<ExpoNotifications | null> | null = null;
let categoriesConfigured = false;

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

  if (!categoriesConfigured) {
    await Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_ID, [
      {
        identifier: TIMER_ACTION_STOP,
        buttonTitle: 'STOP',
        options: { opensAppToForeground: true },
      },
      {
        identifier: TIMER_ACTION_PAUSE,
        buttonTitle: 'PAUSE',
        options: { opensAppToForeground: false },
      },
    ]);
    categoriesConfigured = true;
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

function capitalizeTitle(title: string): string {
  if (!title) return 'Activity';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function buildNotificationBody(timer: ActiveTimer): string {
  const elapsed = formatTimerElapsed(getTimerElapsedSeconds(timer));
  if (isTimerPaused(timer)) return `PAUSED · ${elapsed}`;
  return elapsed;
}

export async function showLifeLogTimerNotification(timer: ActiveTimer): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const ready = await ensureTimerChannel(Notifications);
  if (!ready) return;

  const pauseLabel = isTimerPaused(timer) ? 'RESUME' : 'PAUSE';

  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIFICATION_ID,
    content: {
      title: `🟢 ${capitalizeTitle(timer.title)}`,
      body: buildNotificationBody(timer),
      data: { source: TIMER_SOURCE, action: TIMER_ACTION_PAUSE },
      sound: false,
      sticky: true,
      categoryIdentifier: TIMER_CATEGORY_ID,
      ...(Platform.OS === 'android'
        ? {
            channelId: CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.LOW,
          }
        : {}),
    },
    trigger: null,
  });

  // Re-register category with dynamic pause/resume label on iOS
  await Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_ID, [
    {
      identifier: TIMER_ACTION_STOP,
      buttonTitle: 'STOP',
      options: { opensAppToForeground: true },
    },
    {
      identifier: TIMER_ACTION_PAUSE,
      buttonTitle: pauseLabel,
      options: { opensAppToForeground: false },
    },
  ]);
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
  await cancelTimerRefreshChain();
}

export async function scheduleTimerRefreshChain(timer: ActiveTimer): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications || isTimerPaused(timer)) return;

  await cancelTimerRefreshChain();

  for (let i = 1; i <= 5; i++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${TIMER_REFRESH_PREFIX}${i}`,
      content: {
        title: `🟢 ${capitalizeTitle(timer.title)}`,
        body: buildNotificationBody(timer),
        data: { source: TIMER_SOURCE, refresh: true },
        sound: false,
        sticky: true,
        categoryIdentifier: TIMER_CATEGORY_ID,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: { seconds: i * 60, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
  }
}

export async function cancelTimerRefreshChain(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((item) => item.identifier.startsWith(TIMER_REFRESH_PREFIX))
    .map((item) => item.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
