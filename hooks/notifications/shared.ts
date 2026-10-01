import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';

export const SMART_NOTIFICATION_SOURCE = 'lifegame-smart';

type ExpoNotifications = typeof import('expo-notifications');

/** Expo Go — not a dev/production binary. */
export function isExpoGoRuntime(): boolean {
  try {
    if (isRunningInExpoGo()) return true;
  } catch {
    // ExpoGo native module can throw before it's wired
  }
  return Constants.appOwnership === 'expo';
}

/** Android Expo Go throws on any evaluation of expo-notifications (SDK 53+). */
export function shouldSkipNotificationsModule(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isExpoGoRuntime()) return true;
  return false;
}

export function shouldSkipNotificationHandlers(): boolean {
  return shouldSkipNotificationsModule();
}

let notificationsModule: ExpoNotifications | null | undefined;

function loadNotificationsModule(): ExpoNotifications | null {
  if (shouldSkipNotificationsModule()) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    // Lazy require: a dynamic import() still gets pulled in by Metro as an async
    // chunk and Expo Go throws during that module's side effects.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as ExpoNotifications;
  } catch {
    notificationsModule = null;
  }
  return notificationsModule;
}

export async function getNotificationsModule(): Promise<ExpoNotifications | null> {
  return loadNotificationsModule();
}
