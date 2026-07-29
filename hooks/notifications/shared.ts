import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

export const SMART_NOTIFICATION_SOURCE = 'lifegame-smart';

export function shouldSkipNotificationsModule(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return true;
  return false;
}

export function shouldSkipNotificationHandlers(): boolean {
  return shouldSkipNotificationsModule();
}

let notificationsImportPromise: Promise<typeof import('expo-notifications') | null> | null =
  null;

export async function getNotificationsModule(): Promise<
  typeof import('expo-notifications') | null
> {
  if (shouldSkipNotificationsModule()) return null;
  if (!notificationsImportPromise) {
    notificationsImportPromise = import('expo-notifications').then((m) => m);
  }
  return notificationsImportPromise;
}
