import { Platform } from 'react-native';
import type { ActiveTimer } from '@/store';
import { getNotificationsModule } from '@/hooks/notifications/shared';
import {
  buildLifeLogTimerNotificationContent,
  TIMER_ACTION_PAUSE,
  TIMER_ACTION_STOP,
  TIMER_CATEGORY_ID,
  TIMER_CHANNEL_ID,
  TIMER_NOTIFICATION_ID,
  TIMER_SOURCE,
} from '@/utils/lifeLogTimerNotificationContent';

export {
  TIMER_NOTIFICATION_ID,
  TIMER_CATEGORY_ID,
  TIMER_SOURCE,
  TIMER_ACTION_STOP,
  TIMER_ACTION_PAUSE,
} from '@/utils/lifeLogTimerNotificationContent';

type ExpoNotifications = typeof import('expo-notifications');

let categoriesConfigured = false;

async function ensureTimerChannel(Notifications: ExpoNotifications): Promise<boolean> {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: 'Life Log timer',
      importance: Notifications.AndroidImportance.LOW,
      sound: undefined,
      vibrationPattern: [],
    });
  }
  return true;
}

async function ensureExpoCategories(
  Notifications: ExpoNotifications,
  pauseLabel: string
): Promise<void> {
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
  categoriesConfigured = true;
}

async function presentExpoTimerNotification(
  Notifications: ExpoNotifications,
  timer: ActiveTimer
): Promise<void> {
  const content = buildLifeLogTimerNotificationContent(timer);

  await ensureExpoCategories(Notifications, content.pauseActionLabel);

  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIFICATION_ID,
    content: {
      title: content.title,
      body: content.body,
      data: { source: TIMER_SOURCE },
      sound: false,
      sticky: true,
      categoryIdentifier: TIMER_CATEGORY_ID,
      ...(Platform.OS === 'android'
        ? {
            channelId: TIMER_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.LOW,
          }
        : {}),
    },
    trigger: null,
  });
}

export async function showLifeLogTimerNotification(timer: ActiveTimer): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const ready = await ensureTimerChannel(Notifications);
  if (!ready) return;

  await presentExpoTimerNotification(Notifications, timer);
}

export async function updateLifeLogTimerNotification(timer: ActiveTimer): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // may not exist yet
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // may not exist yet
  }

  await presentExpoTimerNotification(Notifications, timer);
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
