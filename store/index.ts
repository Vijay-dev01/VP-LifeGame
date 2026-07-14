import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSafeStorage } from './persist';
import { getDefaultTitleForCategory } from '@/constants/lifeLogCategories';
import { calcActivityXp, HABIT_XP_BONUS } from '@/constants/xp';
import { calcDurationMinutes, getTimerElapsedSeconds, pushRecentKey, validateLifeLogTimes } from '@/utils/lifeLog';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDate,
  parseISO,
  startOfMonth,
} from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  order: number;
  notificationsEnabled?: boolean;
  reminderTime?: string | null;
}

export interface DayTask {
  id: string;
  date: string;
  title: string;
  done: boolean;
  order: number;
}

export interface NotificationSettings {
  enabled: boolean;
  weeklySummaryEnabled: boolean;
  dailyLimit: 2 | 3;
}

export interface NotificationState {
  date: string;
  sentCount: number;
  sentTypes: string[];
}

export type LifeLogIntent = 'planned' | 'unplanned';
export type LifeLogMood = 'happy' | 'calm' | 'stressed' | 'bored' | 'tired';

export interface LifeLog {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
  energyLevel?: number;
  mood?: LifeLogMood;
  intentType: LifeLogIntent;
  createdAt: string;
}

export interface ActiveTimer {
  title: string;
  category: string;
  startTime: string;
  sessionStartTime: string;
  pausedAt?: string | null;
  accumulatedSeconds?: number;
}

export interface XpEntry {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface DayPlanItem {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  done?: boolean;
}

export type DistractionType = 'meeting' | 'phone' | 'youtube' | 'nothing' | 'other';

export interface NightlyReflection {
  date: string;
  distraction: DistractionType;
  note?: string;
}

export interface AiSettings {
  enabled: boolean;
  apiKey: string;
}

export interface ForgotToStopState {
  lastPromptDate: string | null;
  thresholdHours: number;
}

export type LifeLogInput = Omit<LifeLog, 'id' | 'duration' | 'createdAt'> & {
  duration?: number;
};

interface AppState {
  habits: Habit[];
  completions: Record<string, string[]>;
  dayTasks: Record<string, DayTask[]>;
  notificationSettings: NotificationSettings;
  notificationState: NotificationState;
  currentMonth: string;
  reportRecipient: string;
  autoEmailMonthlyReport: boolean;
  lastProcessedMonth: string | null;
  lifeLogs: LifeLog[];
  activeTimer: ActiveTimer | null;
  recentActivityKeys: string[];
  xpTotal: number;
  xpHistory: XpEntry[];
  dayPlans: Record<string, DayPlanItem[]>;
  dailyGoalScore: number;
  reflections: NightlyReflection[];
  aiSettings: AiSettings;
  forgotToStopState: ForgotToStopState;
  pendingStopFromNotification: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'order'>) => void;
  deleteHabit: (id: string) => void;
  updateHabitNotification: (
    habitId: string,
    updates: { notificationsEnabled?: boolean; reminderTime?: string | null }
  ) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  isHabitDone: (habitId: string, date: string) => boolean;
  addTask: (date: string, title: string) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getTasksForDate: (date: string) => DayTask[];
  addLifeLog: (entry: LifeLogInput) => string | null;
  updateLifeLog: (id: string, patch: Partial<LifeLogInput>) => boolean;
  deleteLifeLog: (id: string) => void;
  duplicateLifeLog: (id: string) => string | null;
  startTimer: (category: string, title?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (overrides?: {
    title?: string;
    notes?: string;
    mood?: LifeLogMood;
    energyLevel?: number;
    intentType?: LifeLogIntent;
  }) => string | null;
  stopTimerAt: (
    endTimeIso: string,
    overrides?: {
      title?: string;
      notes?: string;
      mood?: LifeLogMood;
      energyLevel?: number;
      intentType?: LifeLogIntent;
    }
  ) => string | null;
  discardTimer: () => void;
  awardXp: (amount: number, reason: string) => void;
  addPlanItem: (date: string, item: Omit<DayPlanItem, 'id' | 'date'>) => void;
  removePlanItem: (date: string, id: string) => void;
  getPlanForDate: (date: string) => DayPlanItem[];
  setDailyGoalScore: (score: number) => void;
  markPlanItemDone: (date: string, id: string) => void;
  togglePlanItemDone: (date: string, id: string) => void;
  addReflection: (reflection: Omit<NightlyReflection, 'date'> & { date?: string }) => void;
  getReflectionForDate: (date: string) => NightlyReflection | undefined;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  setForgotToStopThreshold: (hours: number) => void;
  markForgotToStopPrompted: (date: string) => void;
  setPendingStopFromNotification: (pending: boolean) => void;
  getLifeLogsForDate: (date: string) => LifeLog[];
  setCurrentMonth: (date: string) => void;
  setReportRecipient: (email: string) => void;
  setAutoEmailMonthlyReport: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWeeklySummaryEnabled: (enabled: boolean) => void;
  setDailyNotificationLimit: (limit: 2 | 3) => void;
  markNotificationSent: (type: string, date: string) => void;
  resetNotificationState: (date: string) => void;
  markMonthProcessed: (month: string) => void;
  resetAllData: () => void;
  totalDoneThisMonth: () => number;
  bestStreak: () => { days: number; habitName: string };
  monthlyCompletionPercent: () => number;
  consistencyTrend: () => { day: number; count: number }[];
  habitCompletionPercent: (habitId: string) => number;
}

const genId = () => Math.random().toString(36).slice(2, 11);

// Pure helpers for derived state (use in useMemo to avoid getSnapshot infinite loop)
export function computeTotalDoneThisMonth(
  completions: Record<string, string[]>,
  currentMonth: string
): number {
  const start = new Date(currentMonth + 'T12:00:00');
  const end = endOfMonth(start);
  let total = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    total += (completions[format(d, 'yyyy-MM-dd')] ?? []).length;
  }
  return total;
}

export function computeBestStreak(
  habits: Habit[],
  completions: Record<string, string[]>
): { days: number; habitName: string } {
  let bestDays = 0;
  let bestName = '';
  for (const habit of habits) {
    const dates = Object.entries(completions)
      .filter(([, ids]) => ids.includes(habit.id))
      .map(([d]) => d)
      .sort();
    let streak = 0;
    let maxStreak = 0;
    let prev: string | null = null;
    for (const d of dates) {
      streak =
        prev && differenceInCalendarDays(new Date(d), new Date(prev)) === 1
          ? streak + 1
          : 1;
      prev = d;
      maxStreak = Math.max(maxStreak, streak);
    }
    if (maxStreak > bestDays) {
      bestDays = maxStreak;
      bestName = habit.name;
    }
  }
  return { days: bestDays, habitName: bestName || '—' };
}

export function computeMonthlyCompletionPercent(
  habits: Habit[],
  completions: Record<string, string[]>,
  currentMonth: string
): number {
  const start = new Date(currentMonth + 'T12:00:00');
  const end = endOfMonth(start);
  const possible = habits.length * getDate(end);
  if (possible === 0) return 0;
  return Math.round((computeTotalDoneThisMonth(completions, currentMonth) / possible) * 100);
}

export function computeConsistencyTrend(
  completions: Record<string, string[]>,
  currentMonth: string
): { day: number; count: number }[] {
  const start = new Date(currentMonth + 'T12:00:00');
  const daysInMonth = getDate(endOfMonth(start));
  const result: { day: number; count: number }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const key = format(addDays(start, i - 1), 'yyyy-MM-dd');
    result.push({ day: i, count: (completions[key] ?? []).length });
  }
  return result;
}

export function computeHabitCompletionPercent(
  habitId: string,
  completions: Record<string, string[]>,
  currentMonth: string
): number {
  const start = new Date(currentMonth + 'T12:00:00');
  const end = endOfMonth(start);
  const daysInMonth = getDate(end);
  let done = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    if ((completions[format(d, 'yyyy-MM-dd')] ?? []).includes(habitId)) done++;
  }
  return daysInMonth === 0 ? 0 : Math.round((done / daysInMonth) * 100);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: {},
      dayTasks: {},
      notificationSettings: {
        enabled: true,
        weeklySummaryEnabled: false,
        dailyLimit: 3,
      },
      notificationState: {
        date: '',
        sentCount: 0,
        sentTypes: [],
      },
      currentMonth: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      reportRecipient: 'vijayajay3535@gmail.com',
      autoEmailMonthlyReport: true,
      lastProcessedMonth: null,
      lifeLogs: [],
      activeTimer: null,
      recentActivityKeys: [],
      xpTotal: 0,
      xpHistory: [],
      dayPlans: {},
      dailyGoalScore: 90,
      reflections: [],
      aiSettings: { enabled: false, apiKey: '' },
      forgotToStopState: { lastPromptDate: null, thresholdHours: 4 },
      pendingStopFromNotification: false,

      addHabit: (habit) => {
        const order = get().habits.length;
        set((s) => ({
          habits: [
            ...s.habits,
            {
              ...habit,
              notificationsEnabled: habit.notificationsEnabled ?? false,
              reminderTime: habit.reminderTime ?? null,
              id: genId(),
              order,
            },
          ],
        }));
      },

      deleteHabit: (id) => {
        set((s) => {
          const next = s.habits.filter((h) => h.id !== id);
          const completions = { ...s.completions };
          for (const date of Object.keys(completions)) {
            completions[date] = completions[date].filter((hid) => hid !== id);
            if (completions[date].length === 0) delete completions[date];
          }
          return { habits: next, completions };
        });
      },

      updateHabitNotification: (habitId, updates) => {
        set((s) => ({
          habits: s.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  notificationsEnabled:
                    updates.notificationsEnabled ?? habit.notificationsEnabled ?? false,
                  reminderTime:
                    updates.reminderTime === undefined ? habit.reminderTime ?? null : updates.reminderTime,
                }
              : habit
          ),
        }));
      },

      toggleHabitDay: (habitId, date) => {
        set((s) => {
          const list = s.completions[date] ?? [];
          const has = list.includes(habitId);
          const next = has ? list.filter((id) => id !== habitId) : [...list, habitId];
          const completions = { ...s.completions };
          if (next.length) completions[date] = next;
          else delete completions[date];
          if (!has) {
            const habit = s.habits.find((h) => h.id === habitId);
            get().awardXp(HABIT_XP_BONUS, habit?.name ?? 'Habit');
          }
          return { completions };
        });
      },

      isHabitDone: (habitId, date) =>
        (get().completions[date] ?? []).includes(habitId),

      addTask: (date, title) => {
        const tasks = get().dayTasks[date] ?? [];
        set((s) => ({
          dayTasks: {
            ...s.dayTasks,
            [date]: [...tasks, { id: genId(), date, title, done: false, order: tasks.length }],
          },
        }));
      },

      deleteTask: (id) => {
        set((s) => {
          const next = { ...s.dayTasks };
          for (const date of Object.keys(next)) {
            next[date] = next[date].filter((t) => t.id !== id);
            if (next[date].length === 0) delete next[date];
          }
          return { dayTasks: next };
        });
      },

      toggleTask: (id) => {
        set((s) => {
          const next = { ...s.dayTasks };
          for (const date of Object.keys(next)) {
            next[date] = next[date].map((t) =>
              t.id === id ? { ...t, done: !t.done } : t
            );
          }
          return { dayTasks: next };
        });
      },

      getTasksForDate: (date) => get().dayTasks[date] ?? [],

      addLifeLog: (entry) => {
        const err = validateLifeLogTimes(entry.startTime, entry.endTime);
        if (err) return null;
        const duration = entry.duration ?? calcDurationMinutes(entry.startTime, entry.endTime);
        const id = genId();
        const log: LifeLog = {
          ...entry,
          id,
          duration,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          lifeLogs: [...s.lifeLogs, log],
          recentActivityKeys: pushRecentKey(s.recentActivityKeys, entry.category, entry.title),
        }));
        return id;
      },

      updateLifeLog: (id, patch) => {
        const existing = get().lifeLogs.find((l) => l.id === id);
        if (!existing) return false;
        const startTime = patch.startTime ?? existing.startTime;
        const endTime = patch.endTime ?? existing.endTime;
        const err = validateLifeLogTimes(startTime, endTime);
        if (err) return false;
        const duration = calcDurationMinutes(startTime, endTime);
        set((s) => ({
          lifeLogs: s.lifeLogs.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...patch,
                  startTime,
                  endTime,
                  duration,
                }
              : l
          ),
          recentActivityKeys:
            patch.category || patch.title
              ? pushRecentKey(
                  s.recentActivityKeys,
                  patch.category ?? existing.category,
                  patch.title ?? existing.title
                )
              : s.recentActivityKeys,
        }));
        return true;
      },

      deleteLifeLog: (id) => {
        set((s) => ({
          lifeLogs: s.lifeLogs.filter((l) => l.id !== id),
        }));
      },

      duplicateLifeLog: (id) => {
        const existing = get().lifeLogs.find((l) => l.id === id);
        if (!existing) return null;
        const now = new Date();
        const durationMs = existing.duration * 60 * 1000;
        const endTime = now.toISOString();
        const startTime = new Date(now.getTime() - durationMs).toISOString();
        return get().addLifeLog({
          title: existing.title,
          category: existing.category,
          startTime,
          endTime,
          notes: existing.notes,
          energyLevel: existing.energyLevel,
          mood: existing.mood,
          intentType: existing.intentType,
        });
      },

      startTimer: (category, title) => {
        const resolvedTitle = title?.trim() || getDefaultTitleForCategory(category);
        const startTime = new Date().toISOString();
        set({
          activeTimer: {
            category,
            title: resolvedTitle,
            startTime,
            sessionStartTime: startTime,
            pausedAt: null,
            accumulatedSeconds: 0,
          },
        });
      },

      pauseTimer: () => {
        const timer = get().activeTimer;
        if (!timer || timer.pausedAt) return;
        const elapsed = getTimerElapsedSeconds(timer);
        set({
          activeTimer: {
            ...timer,
            pausedAt: new Date().toISOString(),
            accumulatedSeconds: elapsed,
          },
        });
      },

      resumeTimer: () => {
        const timer = get().activeTimer;
        if (!timer || !timer.pausedAt) return;
        set({
          activeTimer: {
            ...timer,
            startTime: new Date().toISOString(),
            pausedAt: null,
          },
        });
      },

      awardXp: (amount, reason) => {
        if (amount <= 0) return;
        const entry: XpEntry = {
          id: genId(),
          amount,
          reason,
          date: format(new Date(), 'yyyy-MM-dd'),
        };
        set((s) => ({
          xpTotal: s.xpTotal + amount,
          xpHistory: [entry, ...s.xpHistory].slice(0, 100),
        }));
      },

      stopTimer: (overrides) => {
        const timer = get().activeTimer;
        if (!timer) return null;
        const endTime = new Date().toISOString();
        const title = overrides?.title?.trim() || timer.title;
        const id = get().addLifeLog({
          title,
          category: timer.category,
          startTime: timer.sessionStartTime ?? timer.startTime,
          endTime,
          notes: overrides?.notes,
          mood: overrides?.mood,
          energyLevel: overrides?.energyLevel,
          intentType: overrides?.intentType ?? 'unplanned',
        });
        if (id) {
          get().awardXp(calcActivityXp(timer.category, title), title);
        }
        set({ activeTimer: null, pendingStopFromNotification: false });
        return id;
      },

      stopTimerAt: (endTimeIso, overrides) => {
        const timer = get().activeTimer;
        if (!timer) return null;
        const title = overrides?.title?.trim() || timer.title;
        const err = validateLifeLogTimes(timer.sessionStartTime ?? timer.startTime, endTimeIso);
        if (err) return null;
        const id = get().addLifeLog({
          title,
          category: timer.category,
          startTime: timer.sessionStartTime ?? timer.startTime,
          endTime: endTimeIso,
          notes: overrides?.notes,
          mood: overrides?.mood,
          energyLevel: overrides?.energyLevel,
          intentType: overrides?.intentType ?? 'unplanned',
        });
        if (id) {
          get().awardXp(calcActivityXp(timer.category, title), title);
        }
        set({ activeTimer: null, pendingStopFromNotification: false });
        return id;
      },

      discardTimer: () => {
        set({ activeTimer: null, pendingStopFromNotification: false });
      },

      getLifeLogsForDate: (date) => {
        return get()
          .lifeLogs.filter((l) => format(parseISO(l.startTime), 'yyyy-MM-dd') === date)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      },

      addPlanItem: (date, item) => {
        const plans = get().dayPlans[date] ?? [];
        const newItem: DayPlanItem = { ...item, id: genId(), date };
        const sorted = [...plans, newItem].sort((a, b) => a.time.localeCompare(b.time));
        set((s) => ({
          dayPlans: { ...s.dayPlans, [date]: sorted },
        }));
      },

      removePlanItem: (date, id) => {
        set((s) => {
          const plans = (s.dayPlans[date] ?? []).filter((p) => p.id !== id);
          const next = { ...s.dayPlans };
          if (plans.length) next[date] = plans;
          else delete next[date];
          return { dayPlans: next };
        });
      },

      getPlanForDate: (date) => get().dayPlans[date] ?? [],

      setDailyGoalScore: (score) => set({ dailyGoalScore: Math.min(100, Math.max(0, score)) }),

      markPlanItemDone: (date, id) => {
        set((s) => ({
          dayPlans: {
            ...s.dayPlans,
            [date]: (s.dayPlans[date] ?? []).map((p) =>
              p.id === id ? { ...p, done: true } : p
            ),
          },
        }));
      },

      togglePlanItemDone: (date, id) => {
        set((s) => ({
          dayPlans: {
            ...s.dayPlans,
            [date]: (s.dayPlans[date] ?? []).map((p) =>
              p.id === id ? { ...p, done: !p.done } : p
            ),
          },
        }));
      },

      addReflection: (reflection) => {
        const date = reflection.date ?? format(new Date(), 'yyyy-MM-dd');
        set((s) => ({
          reflections: [
            ...s.reflections.filter((r) => r.date !== date),
            { distraction: reflection.distraction, note: reflection.note, date },
          ],
        }));
      },

      getReflectionForDate: (date) => get().reflections.find((r) => r.date === date),

      setAiSettings: (settings) =>
        set((s) => ({
          aiSettings: { ...s.aiSettings, ...settings },
        })),

      setForgotToStopThreshold: (hours) =>
        set((s) => ({
          forgotToStopState: { ...s.forgotToStopState, thresholdHours: hours },
        })),

      markForgotToStopPrompted: (date) =>
        set((s) => ({
          forgotToStopState: { ...s.forgotToStopState, lastPromptDate: date },
        })),

      setPendingStopFromNotification: (pending) => set({ pendingStopFromNotification: pending }),

      setCurrentMonth: (date) => set({ currentMonth: date }),
      setReportRecipient: (email) => set({ reportRecipient: email }),
      setAutoEmailMonthlyReport: (enabled) => set({ autoEmailMonthlyReport: enabled }),
      setNotificationsEnabled: (enabled) =>
        set((s) => ({
          notificationSettings: { ...s.notificationSettings, enabled },
        })),
      setWeeklySummaryEnabled: (enabled) =>
        set((s) => ({
          notificationSettings: { ...s.notificationSettings, weeklySummaryEnabled: enabled },
        })),
      setDailyNotificationLimit: (limit) =>
        set((s) => ({
          notificationSettings: { ...s.notificationSettings, dailyLimit: limit },
        })),
      markNotificationSent: (type, date) =>
        set((s) => {
          const nextState =
            s.notificationState.date === date
              ? s.notificationState
              : { date, sentCount: 0, sentTypes: [] };
          if (nextState.sentTypes.includes(type)) {
            return { notificationState: nextState };
          }
          return {
            notificationState: {
              date,
              sentCount: nextState.sentCount + 1,
              sentTypes: [...nextState.sentTypes, type],
            },
          };
        }),
      resetNotificationState: (date) =>
        set({
          notificationState: {
            date,
            sentCount: 0,
            sentTypes: [],
          },
        }),
      markMonthProcessed: (month) => set({ lastProcessedMonth: month }),
      resetAllData: () =>
        set({
          habits: [],
          completions: {},
          dayTasks: {},
          lifeLogs: [],
          activeTimer: null,
          recentActivityKeys: [],
          xpTotal: 0,
          xpHistory: [],
          dayPlans: {},
          dailyGoalScore: 90,
          reflections: [],
          aiSettings: { enabled: false, apiKey: '' },
          forgotToStopState: { lastPromptDate: null, thresholdHours: 4 },
          pendingStopFromNotification: false,
          notificationState: {
            date: '',
            sentCount: 0,
            sentTypes: [],
          },
        }),

      totalDoneThisMonth: () => {
        const { completions, currentMonth } = get();
        const start = new Date(currentMonth + 'T12:00:00');
        const end = endOfMonth(start);
        let total = 0;
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
          total += (completions[format(d, 'yyyy-MM-dd')] ?? []).length;
        }
        return total;
      },

      bestStreak: () => {
        const { habits, completions } = get();
        let bestDays = 0;
        let bestName = '';
        for (const habit of habits) {
          const dates = Object.entries(completions)
            .filter(([, ids]) => ids.includes(habit.id))
            .map(([d]) => d)
            .sort();
          let streak = 0;
          let maxStreak = 0;
          let prev: string | null = null;
          for (const d of dates) {
            streak =
              prev && differenceInCalendarDays(new Date(d), new Date(prev)) === 1
                ? streak + 1
                : 1;
            prev = d;
            maxStreak = Math.max(maxStreak, streak);
          }
          if (maxStreak > bestDays) {
            bestDays = maxStreak;
            bestName = habit.name;
          }
        }
        return { days: bestDays, habitName: bestName || '—' };
      },

      monthlyCompletionPercent: () => {
        const { habits, currentMonth } = get();
        const start = new Date(currentMonth + 'T12:00:00');
        const end = endOfMonth(start);
        const possible = habits.length * getDate(end);
        if (possible === 0) return 0;
        return Math.round((get().totalDoneThisMonth() / possible) * 100);
      },

      consistencyTrend: () => {
        const { completions, currentMonth } = get();
        const start = new Date(currentMonth + 'T12:00:00');
        const daysInMonth = getDate(endOfMonth(start));
        const result: { day: number; count: number }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const key = format(addDays(start, i - 1), 'yyyy-MM-dd');
          result.push({ day: i, count: (completions[key] ?? []).length });
        }
        return result;
      },

      habitCompletionPercent: (habitId) => {
        const { currentMonth } = get();
        const start = new Date(currentMonth + 'T12:00:00');
        const end = endOfMonth(start);
        const daysInMonth = getDate(end);
        let done = 0;
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
          if ((get().completions[format(d, 'yyyy-MM-dd')] ?? []).includes(habitId)) done++;
        }
        return daysInMonth === 0 ? 0 : Math.round((done / daysInMonth) * 100);
      },
    }),
    {
      name: 'lifegame-store',
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (s) => ({
        habits: s.habits,
        completions: s.completions,
        dayTasks: s.dayTasks,
        lifeLogs: s.lifeLogs,
        recentActivityKeys: s.recentActivityKeys,
        notificationSettings: s.notificationSettings,
        notificationState: s.notificationState,
        reportRecipient: s.reportRecipient,
        autoEmailMonthlyReport: s.autoEmailMonthlyReport,
        lastProcessedMonth: s.lastProcessedMonth,
        activeTimer: s.activeTimer,
        xpTotal: s.xpTotal,
        xpHistory: s.xpHistory,
        dayPlans: s.dayPlans,
        dailyGoalScore: s.dailyGoalScore,
        reflections: s.reflections,
        aiSettings: s.aiSettings,
        forgotToStopState: s.forgotToStopState,
      }),
    }
  )
);
