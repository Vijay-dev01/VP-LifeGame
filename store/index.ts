import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSafeStorage } from './persist';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDate,
  startOfMonth,
} from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  order: number;
}

export interface DayTask {
  id: string;
  date: string;
  title: string;
  done: boolean;
  order: number;
}

interface AppState {
  habits: Habit[];
  completions: Record<string, string[]>;
  dayTasks: Record<string, DayTask[]>;
  currentMonth: string;
  reportRecipient: string;
  autoEmailMonthlyReport: boolean;
  lastProcessedMonth: string | null;
  addHabit: (habit: Omit<Habit, 'id' | 'order'>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  isHabitDone: (habitId: string, date: string) => boolean;
  addTask: (date: string, title: string) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getTasksForDate: (date: string) => DayTask[];
  setCurrentMonth: (date: string) => void;
  setReportRecipient: (email: string) => void;
  setAutoEmailMonthlyReport: (enabled: boolean) => void;
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
      currentMonth: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      reportRecipient: 'vijayajay3535@gmail.com',
      autoEmailMonthlyReport: true,
      lastProcessedMonth: null,

      addHabit: (habit) => {
        const order = get().habits.length;
        set((s) => ({
          habits: [...s.habits, { ...habit, id: genId(), order }],
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

      toggleHabitDay: (habitId, date) => {
        set((s) => {
          const list = s.completions[date] ?? [];
          const has = list.includes(habitId);
          const next = has ? list.filter((id) => id !== habitId) : [...list, habitId];
          const completions = { ...s.completions };
          if (next.length) completions[date] = next;
          else delete completions[date];
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
      setCurrentMonth: (date) => set({ currentMonth: date }),
      setReportRecipient: (email) => set({ reportRecipient: email }),
      setAutoEmailMonthlyReport: (enabled) => set({ autoEmailMonthlyReport: enabled }),
      markMonthProcessed: (month) => set({ lastProcessedMonth: month }),
      resetAllData: () => set({ habits: [], completions: {}, dayTasks: {} }),

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
        reportRecipient: s.reportRecipient,
        autoEmailMonthlyReport: s.autoEmailMonthlyReport,
        lastProcessedMonth: s.lastProcessedMonth,
      }),
    }
  )
);
