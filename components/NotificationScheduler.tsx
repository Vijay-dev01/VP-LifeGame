import { useSmartNotificationsScheduler } from '@/hooks/useSmartNotifications';

/** Headless scheduler — avoids re-rendering the root layout on habit/plan changes. */
export function NotificationScheduler() {
  useSmartNotificationsScheduler();
  return null;
}
