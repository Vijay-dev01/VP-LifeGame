import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { format } from 'date-fns';
import { useStore, type Habit } from '@/store';

const SMART_SOURCE = 'lifegame-smart';
const CHANNEL_ID = 'habit-reminders';

let handlerConfigured = false;

type ExpoNotifications = typeof import('expo-notifications');

/** SDK 53+: loading expo-notifications in Android Expo Go throws (push path). Local notifications need a dev build. */
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

type ReminderChoice = {
  habitId: string;
  habitName: string;
  hour: number;
  minute: number;
};

function parseTime(value?: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function pickEarliestCustomReminder(habits: Habit[]): ReminderChoice | null {
  const withReminders = habits
    .filter((h) => h.notificationsEnabled && h.reminderTime)
    .map((h) => {
      const parsed = parseTime(h.reminderTime);
      if (!parsed) return null;
      return {
        habitId: h.id,
        habitName: h.name,
        hour: parsed.hour,
        minute: parsed.minute,
      };
    })
    .filter((item): item is ReminderChoice => item !== null)
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  return withReminders[0] ?? null;
}

async function ensureNotificationInfra(Notifications: ExpoNotifications) {
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

async function cancelManagedNotifications(Notifications: ExpoNotifications) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((item) => item.content.data?.source === SMART_SOURCE)
    .map((item) => item.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function scheduleRecurringNotification(
  Notifications: ExpoNotifications,
  {
    hour,
    minute,
    title,
    body,
    type,
  }: {
    hour: number;
    minute: number;
    title: string;
    body: string;
    type: string;
  }
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: SMART_SOURCE, type },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function scheduleOneTimeTodayNotification(
  Notifications: ExpoNotifications,
  {
    hour,
    minute,
    title,
    body,
    type,
  }: {
    hour: number;
    minute: number;
    title: string;
    body: string;
    type: string;
  }
) {
  const now = new Date();
  const triggerDate = new Date(now);
  triggerDate.setHours(hour, minute, 0, 0);
  if (triggerDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: SMART_SOURCE, type },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

async function scheduleWeeklySummary(Notifications: ExpoNotifications) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly check-in',
      body: 'Review your week and set your next streak target.',
      data: { source: SMART_SOURCE, type: 'weekly-summary' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 20,
      minute: 0,
    },
  });
}

export function useSmartNotifications() {
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const notificationSettings = useStore((s) => s.notificationSettings);
  const notificationState = useStore((s) => s.notificationState);
  const markNotificationSent = useStore((s) => s.markNotificationSent);
  const resetNotificationState = useStore((s) => s.resetNotificationState);
  const completedRef = useRef<number>(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDone = useMemo(() => (completions[today] ?? []).length, [completions, today]);
  const totalHabits = habits.length;
  const progress = totalHabits === 0 ? 0 : Math.round((todayDone / totalHabits) * 100);

  useEffect(() => {
    if (notificationState.date !== today) {
      resetNotificationState(today);
    }
  }, [notificationState.date, resetNotificationState, today]);

  useEffect(() => {
    completedRef.current = todayDone;
  }, [today]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const Notifications = await getNotificationsModule();
      if (!Notifications || cancelled) return;

      const enabled = await ensureNotificationInfra(Notifications);
      if (!enabled) return;

      await cancelManagedNotifications(Notifications);
      if (!notificationSettings.enabled || cancelled) return;

      const limit = notificationSettings.dailyLimit;
      await scheduleRecurringNotification(Notifications, {
        hour: 8,
        minute: 0,
        title: 'Habit Tracker',
        body: 'Start your day. Complete your habits 💪',
        type: 'morning',
      });

      if (limit >= 2) {
        await scheduleRecurringNotification(Notifications, {
          hour: 20,
          minute: 0,
          title: 'Habit Tracker',
          body: "Don't break your streak 🔥",
          type: 'evening',
        });
      }

      if (limit >= 3) {
        const custom = pickEarliestCustomReminder(habits);
        if (custom) {
          await scheduleRecurringNotification(Notifications, {
            hour: custom.hour,
            minute: custom.minute,
            title: 'Habit Tracker',
            body: `${custom.habitName}: time to take action.`,
            type: `habit-${custom.habitId}`,
          });
        } else {
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          let adaptive: { hour: number; minute: number; body: string; type: string } | null = null;
          if (todayDone === 0 && nowMinutes < 10 * 60) {
            adaptive = {
              hour: 10,
              minute: 0,
              body: 'No wins yet. Start your first habit now.',
              type: 'adaptive-10am',
            };
          } else if (progress < 50 && nowMinutes < 18 * 60) {
            adaptive = {
              hour: 18,
              minute: 0,
              body: 'You are under 50%. Push one more habit now.',
              type: 'adaptive-6pm',
            };
          } else if (progress < 100 && nowMinutes < 21 * 60) {
            adaptive = {
              hour: 21,
              minute: 0,
              body: 'Your streak is at risk. Finish your habits tonight.',
              type: 'adaptive-9pm',
            };
          }
          if (adaptive) {
            await scheduleOneTimeTodayNotification(Notifications, {
              hour: adaptive.hour,
              minute: adaptive.minute,
              title: 'Habit Tracker',
              body: adaptive.body,
              type: adaptive.type,
            });
          }
        }
      }

      if (notificationSettings.weeklySummaryEnabled) {
        await scheduleWeeklySummary(Notifications);
      }
    };

    run().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [habits, notificationSettings, progress, todayDone]);

  useEffect(() => {
    const prevDone = completedRef.current;
    completedRef.current = todayDone;

    if (!notificationSettings.enabled) return;
    if (totalHabits === 0 || todayDone !== totalHabits || prevDone === todayDone) return;
    if (notificationState.date === today && notificationState.sentTypes.includes('completion')) return;
    if (notificationState.date === today && notificationState.sentCount >= notificationSettings.dailyLimit)
      return;

    (async () => {
      const Notifications = await getNotificationsModule();
      if (!Notifications) return;
      await ensureNotificationInfra(Notifications);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit Tracker',
          body: '100% done. Great job 💯',
          data: { source: SMART_SOURCE, type: 'completion' },
          sound: false,
        },
        trigger: null,
      });
      markNotificationSent('completion', today);
    })().catch(() => undefined);
  }, [
    markNotificationSent,
    notificationSettings.dailyLimit,
    notificationSettings.enabled,
    notificationState.date,
    notificationState.sentCount,
    notificationState.sentTypes,
    today,
    todayDone,
    totalHabits,
  ]);
}
