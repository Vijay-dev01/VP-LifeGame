import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import { useStore } from '@/store';
import { PLAN_START_ACTION } from '@/hooks/useEngagementNotificationActions';
import {
  getNotificationsModule,
  SMART_NOTIFICATION_SOURCE,
} from '@/hooks/notifications/shared';
import { isHabitScheduledOn } from '@/utils/habitSchedule';
import {
  nextHabitReminderDates,
  upcomingPlanItemTriggers,
} from '@/utils/notificationTriggers';

const SMART_SOURCE = SMART_NOTIFICATION_SOURCE;
const CHANNEL_ID = 'habit-reminders';
const PLAN_CATEGORY_ID = 'plan-morning-actions';
const RESCHEDULE_DEBOUNCE_MS = 300;

let handlerConfigured = false;

type ExpoNotifications = typeof import('expo-notifications');

function androidChannel() {
  return Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};
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

  await Notifications.setNotificationCategoryAsync(PLAN_CATEGORY_ID, [
    {
      identifier: PLAN_START_ACTION,
      buttonTitle: 'Start',
      options: { opensAppToForeground: true },
    },
  ]);
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
      ...androidChannel(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function scheduleDateNotification(
  Notifications: ExpoNotifications,
  {
    identifier,
    date,
    title,
    body,
    type,
    extraData,
    categoryIdentifier,
  }: {
    identifier: string;
    date: Date;
    title: string;
    body: string;
    type: string;
    extraData?: Record<string, unknown>;
    categoryIdentifier?: string;
  }
) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data: { source: SMART_SOURCE, type, ...extraData },
      sound: false,
      ...(categoryIdentifier ? { categoryIdentifier } : {}),
      ...androidChannel(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
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

  await scheduleDateNotification(Notifications, {
    identifier: `smart-${type}-${format(triggerDate, 'yyyy-MM-dd')}`,
    date: triggerDate,
    title,
    body,
    type,
  });
}

async function scheduleWeeklySummary(Notifications: ExpoNotifications) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly check-in',
      body: 'Review your week and set your next streak target.',
      data: { source: SMART_SOURCE, type: 'weekly-summary' },
      sound: false,
      ...androidChannel(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 20,
      minute: 0,
    },
  });
}

async function runNotificationSchedule() {
  const state = useStore.getState();
  const {
    habits,
    completions,
    dayPlans,
    lifeGoals,
    goalDailyActions,
    notificationSettings,
  } = state;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const enabled = await ensureNotificationInfra(Notifications);
  if (!enabled) return;

  await cancelManagedNotifications(Notifications);
  if (!notificationSettings.enabled) return;

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const todayDone = (completions[today] ?? []).length;
  const scheduledToday = habits.filter((h) => isHabitScheduledOn(h.activeDays, today));
  const totalHabits = scheduledToday.length || habits.length;
  const progress = totalHabits === 0 ? 0 : Math.round((todayDone / totalHabits) * 100);
  const activeGoalCount = lifeGoals.filter((g) => g.status === 'active').length;
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

  let scheduledHabitReminder = false;
  for (const habit of habits) {
    if (!habit.notificationsEnabled || !habit.reminderTime) continue;
    const upcoming = nextHabitReminderDates(habit.activeDays, habit.reminderTime, now, 7);
    for (const item of upcoming) {
      scheduledHabitReminder = true;
      await scheduleDateNotification(Notifications, {
        identifier: `habit-${habit.id}-${item.date}`,
        date: item.trigger,
        title: 'Habit Tracker',
        body: `${habit.name}: time to take action.`,
        type: `habit-${habit.id}`,
      });
    }
  }

  if (limit >= 3 && !scheduledHabitReminder) {
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

  if (notificationSettings.weeklySummaryEnabled) {
    await scheduleWeeklySummary(Notifications);
  }

  await scheduleRecurringNotification(Notifications, {
    hour: 10,
    minute: 0,
    title: 'Life Goals',
    body:
      activeGoalCount > 0
        ? (() => {
            const action = goalDailyActions.find(
              (a) =>
                a.date === today &&
                !a.done &&
                lifeGoals.some((g) => g.id === a.goalId && g.status === 'active')
            );
            return (
              action?.title ??
              `${activeGoalCount} active goal${activeGoalCount > 1 ? 's' : ''} — check in`
            );
          })()
        : 'Set a life goal and turn ambition into daily action',
    type: 'goal-daily-action',
  });

  await scheduleRecurringNotification(Notifications, {
    hour: 21,
    minute: 0,
    title: 'Plan Tomorrow',
    body: 'Ready to plan tomorrow?',
    type: 'plan-evening',
  });

  await scheduleRecurringNotification(Notifications, {
    hour: 21,
    minute: 30,
    title: 'Daily Reflection',
    body: 'What distracted you today?',
    type: 'reflection-evening',
  });

  const allPlanItems = Object.values(dayPlans).flat();
  const upcomingPlans = upcomingPlanItemTriggers(allPlanItems, now);
  for (const item of upcomingPlans) {
    await scheduleDateNotification(Notifications, {
      identifier: `plan-${item.id}`,
      date: item.trigger,
      title: 'Plan reminder',
      body: item.title,
      type: 'plan-item',
      extraData: { planId: item.id },
      categoryIdentifier: PLAN_CATEGORY_ID,
    });
  }

  const todayPlans = dayPlans[today] ?? [];
  const todayUpcoming = upcomingPlanItemTriggers(todayPlans, now);
  if (todayUpcoming.length === 0) {
    await scheduleRecurringNotification(Notifications, {
      hour: 8,
      minute: 0,
      title: 'Good morning',
      body: todayPlans.length ? 'Your planned tasks are ready' : 'No plan yet — tap to plan your day',
      type: 'plan-morning',
    });
  }
}

async function maybeSendCompletionNotification(prevDone: number, todayDone: number) {
  const state = useStore.getState();
  const { notificationSettings, notificationState, habits, completions } = state;
  const today = format(new Date(), 'yyyy-MM-dd');
  const scheduledToday = habits.filter((h) => isHabitScheduledOn(h.activeDays, today));
  const totalHabits = scheduledToday.length;
  const doneScheduled = scheduledToday.filter((h) =>
    (completions[today] ?? []).includes(h.id)
  ).length;

  if (!notificationSettings.enabled) return;
  if (totalHabits === 0 || doneScheduled !== totalHabits || prevDone === todayDone) return;
  if (notificationState.date === today && notificationState.sentTypes.includes('completion')) return;
  if (notificationState.date === today && notificationState.sentCount >= notificationSettings.dailyLimit)
    return;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await ensureNotificationInfra(Notifications);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Tracker',
      body: '100% done. Great job 💯',
      data: { source: SMART_SOURCE, type: 'completion' },
      sound: false,
      ...androidChannel(),
    },
    trigger: null,
  });
  useStore.getState().markNotificationSent('completion', today);
}

/** @deprecated Use NotificationScheduler component instead */
export function useSmartNotifications() {
  useSmartNotificationsScheduler();
}

export function useSmartNotificationsScheduler() {
  const completedRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const state = useStore.getState();
    if (state.notificationState.date !== today) {
      state.resetNotificationState(today);
    }
    completedRef.current = (state.completions[today] ?? []).length;

    const scheduleDebounced = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        runNotificationSchedule().catch(() => undefined);
      }, RESCHEDULE_DEBOUNCE_MS);
    };

    scheduleDebounced();

    const unsub = useStore.subscribe((next, prev) => {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const nextDone = (next.completions[todayKey] ?? []).length;
      const prevDone = (prev.completions[todayKey] ?? []).length;

      if (nextDone !== prevDone) {
        maybeSendCompletionNotification(completedRef.current, nextDone).catch(() => undefined);
        completedRef.current = nextDone;
      }

      if (
        next.habits !== prev.habits ||
        next.completions !== prev.completions ||
        next.dayPlans !== prev.dayPlans ||
        next.notificationSettings !== prev.notificationSettings ||
        next.lifeGoals !== prev.lifeGoals ||
        next.goalDailyActions !== prev.goalDailyActions
      ) {
        scheduleDebounced();
      }
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
