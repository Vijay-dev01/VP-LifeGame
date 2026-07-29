import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSafeStorage } from './persist';
import { genId } from '@/utils/ids';
import { stashLegacyApiKey } from '@/utils/legacyAiKeyMigration';
import { getDefaultTitleForCategory } from '@/constants/lifeLogCategories';
import { calcActivityXp, GOAL_XP, HABIT_XP_BONUS } from '@/constants/xp';
import type {
  CreateGoalInput,
  GoalDailyAction,
  GoalHealthSnapshot,
  GoalProgressEntry,
  GoalProgressRule,
  GoalWeeklyTarget,
  LifeGoal,
  UpdateGoalInput,
} from '@/store/goalTypes';
import {
  generateDailyActionsForWeek,
  generateWeeklyTarget,
  getWeekStart,
} from '@/utils/goalDecomposition';
import { computeGoalHealth } from '@/utils/goalHealth';
import { syncDailyActionsFromDayProgress } from '@/utils/goalDailyActionSync';
import { matchesProgressRule, suggestKeywordsFromTitle } from '@/utils/goalMatching';
import { calcDurationMinutes, getTimerElapsedSeconds, pushRecentKey, validateLifeLogTimes } from '@/utils/lifeLog';
import {
  addDays,
  format,
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
  goalId?: string;
  goalDailyActionId?: string;
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
}

export interface ForgotToStopState {
  lastPromptDate: string | null;
  thresholdHours: number;
}

export interface BuddySettings {
  enabled: boolean;
  userName: string;
  lockScreenListen: boolean;
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
  buddySettings: BuddySettings;
  pendingStopFromNotification: boolean;
  lifeGoals: LifeGoal[];
  goalWeeklyTargets: GoalWeeklyTarget[];
  goalDailyActions: GoalDailyAction[];
  goalProgressRules: GoalProgressRule[];
  goalProgressEntries: GoalProgressEntry[];
  goalHealthSnapshots: GoalHealthSnapshot[];
  addLifeGoal: (input: CreateGoalInput) => string;
  updateLifeGoal: (id: string, patch: Partial<LifeGoal>) => void;
  updateLifeGoalDetails: (id: string, input: UpdateGoalInput) => void;
  deleteLifeGoal: (id: string) => void;
  addManualGoalProgress: (goalId: string, amount?: number, note?: string) => void;
  deleteGoalProgressEntry: (entryId: string) => void;
  incrementGoalProgress: (
    goalId: string,
    amount: number,
    meta: { source: GoalProgressEntry['source']; sourceId?: string; note?: string; date?: string }
  ) => void;
  ensureWeeklyTargetsForActiveGoals: () => void;
  evaluateGoalProgressFromMission: (task: DayTask, wasDone: boolean, nowDone: boolean) => void;
  evaluateGoalProgressFromLifeLog: (log: LifeLog) => void;
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
  findTaskByTitle: (date: string, query: string) => DayTask | undefined;
  addTasksBulk: (date: string, titles: string[]) => number;
  completeTaskByTitle: (query: string) => { found: boolean; title: string | null; date: string | null };
  setBuddySettings: (settings: Partial<BuddySettings>) => void;
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
}

export {
  computeBestStreak,
  computeConsistencyTrend,
  computeHabitCompletionPercent,
  computeMonthlyCompletionPercent,
  computeTotalDoneThisMonth,
} from './selectors';

function recomputeGoalCurrentValue(
  goalId: string,
  entries: GoalProgressEntry[]
): number {
  return entries.filter((e) => e.goalId === goalId).reduce((sum, e) => sum + e.amount, 0);
}

function checkAndAwardGoalMilestones(
  goal: LifeGoal,
  awardXp: (amount: number, reason: string) => void
): LifeGoal {
  if (goal.targetValue <= 0) return goal;
  const pct = (goal.currentValue / goal.targetValue) * 100;
  const milestones = [
    { threshold: 25, xp: GOAL_XP.MILESTONE_25, label: '25%' },
    { threshold: 50, xp: GOAL_XP.MILESTONE_50, label: '50%' },
    { threshold: 75, xp: GOAL_XP.MILESTONE_75, label: '75%' },
    { threshold: 100, xp: GOAL_XP.GOAL_COMPLETE, label: '100%' },
  ];
  let lastMilestone = goal.lastMilestoneAwarded ?? 0;
  for (const m of milestones) {
    if (pct >= m.threshold && lastMilestone < m.threshold) {
      awardXp(m.xp, `${goal.title}: ${m.label} milestone`);
      lastMilestone = m.threshold;
    }
  }
  const completed = goal.currentValue >= goal.targetValue;
  return {
    ...goal,
    lastMilestoneAwarded: lastMilestone,
    status: completed ? 'completed' : goal.status,
    completedAt: completed && !goal.completedAt ? new Date().toISOString() : goal.completedAt,
  };
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
      aiSettings: { enabled: false },
      forgotToStopState: { lastPromptDate: null, thresholdHours: 4 },
      buddySettings: { enabled: false, userName: 'Vijay', lockScreenListen: false },
      pendingStopFromNotification: false,
      lifeGoals: [],
      goalWeeklyTargets: [],
      goalDailyActions: [],
      goalProgressRules: [],
      goalProgressEntries: [],
      goalHealthSnapshots: [],

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
        const state = get();
        let toggledTask: DayTask | undefined;
        let wasDone = false;
        for (const date of Object.keys(state.dayTasks)) {
          const task = state.dayTasks[date]?.find((t) => t.id === id);
          if (task) {
            toggledTask = task;
            wasDone = task.done;
            break;
          }
        }
        set((s) => {
          const next = { ...s.dayTasks };
          for (const date of Object.keys(next)) {
            next[date] = next[date].map((t) =>
              t.id === id ? { ...t, done: !t.done } : t
            );
          }
          return { dayTasks: next };
        });
        if (toggledTask) {
          get().evaluateGoalProgressFromMission(toggledTask, wasDone, !wasDone);
        }
      },

      getTasksForDate: (date) => get().dayTasks[date] ?? [],

      findTaskByTitle: (date, query) => {
        const q = query.toLowerCase().trim();
        if (!q) return undefined;
        const tasks = get().dayTasks[date] ?? [];
        return (
          tasks.find((t) => t.title.toLowerCase() === q) ??
          tasks.find((t) => t.title.toLowerCase().includes(q)) ??
          tasks.find((t) => q.includes(t.title.toLowerCase()))
        );
      },

      addTasksBulk: (date, titles) => {
        let added = 0;
        for (const title of titles) {
          const t = title.trim();
          if (!t) continue;
          get().addTask(date, t);
          added++;
        }
        return added;
      },

      completeTaskByTitle: (query) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        for (const date of [today, tomorrow]) {
          const task = get().findTaskByTitle(date, query);
          if (task && !task.done) {
            get().toggleTask(task.id);
            return { found: true, title: task.title, date };
          }
        }
        return { found: false, title: null, date: null };
      },

      setBuddySettings: (settings) =>
        set((s) => ({
          buddySettings: { ...s.buddySettings, ...settings },
        })),

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
        get().evaluateGoalProgressFromLifeLog(log);
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
        const plan = get().dayPlans[date]?.find((p) => p.id === id);
        const wasDone = plan?.done ?? false;
        set((s) => ({
          dayPlans: {
            ...s.dayPlans,
            [date]: (s.dayPlans[date] ?? []).map((p) =>
              p.id === id ? { ...p, done: !p.done } : p
            ),
          },
        }));
        if (plan && !wasDone) {
          const fakeTask: DayTask = {
            id: plan.id,
            date,
            title: plan.title,
            done: true,
            order: 0,
          };
          get().evaluateGoalProgressFromMission(fakeTask, false, true);
        }
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

      addLifeGoal: (input) => {
        const id = genId();
        const today = format(new Date(), 'yyyy-MM-dd');
        const order = get().lifeGoals.length;
        const goal: LifeGoal = {
          id,
          title: input.title.trim(),
          emoji: input.emoji,
          category: input.category,
          metricType: input.metricType,
          targetValue: input.targetValue,
          currentValue: 0,
          unit: input.unit,
          startDate: today,
          deadlineDate: input.deadlineDate,
          status: 'active',
          motivationNote: input.motivationNote,
          linkedHabitIds: [],
          createdAt: new Date().toISOString(),
          order,
          lastMilestoneAwarded: 0,
        };
        const rules: GoalProgressRule[] = input.progressRules.map((r) => ({
          ...r,
          id: genId(),
          goalId: id,
        }));
        if (rules.length === 0) {
          rules.push({
            id: genId(),
            goalId: id,
            source: 'mission',
            matchType: 'keyword',
            matchValue: suggestKeywordsFromTitle(input.title),
            incrementValue: 1,
            enabled: true,
          });
          rules.push({
            id: genId(),
            goalId: id,
            source: 'life_log',
            matchType: 'keyword',
            matchValue: suggestKeywordsFromTitle(input.title),
            incrementValue: input.metricType === 'duration_minutes' ? 0 : 1,
            enabled: true,
          });
        }
        const weeklyTarget = generateWeeklyTarget(
          id,
          input.targetValue,
          input.deadlineDate,
          today
        );
        const dailyActions = generateDailyActionsForWeek(
          id,
          weeklyTarget,
          input.title,
          input.unit,
          today
        );
        const dayTasks = { ...get().dayTasks };
        for (const action of dailyActions) {
          const tasks = dayTasks[action.date] ?? [];
          const taskId = genId();
          action.missionTaskId = taskId;
          dayTasks[action.date] = [
            ...tasks,
            {
              id: taskId,
              date: action.date,
              title: action.title,
              done: false,
              order: tasks.length,
              goalId: id,
              goalDailyActionId: action.id,
            },
          ];
        }
        set((s) => ({
          lifeGoals: [...s.lifeGoals, goal],
          goalProgressRules: [...s.goalProgressRules, ...rules],
          goalWeeklyTargets: [...s.goalWeeklyTargets, weeklyTarget],
          goalDailyActions: [...s.goalDailyActions, ...dailyActions],
          dayTasks,
        }));
        return id;
      },

      updateLifeGoal: (id, patch) => {
        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },

      updateLifeGoalDetails: (id, input) => {
        const state = get();
        const goal = state.lifeGoals.find((g) => g.id === id);
        if (!goal) return;

        const keywords = suggestKeywordsFromTitle(input.title);
        let goalProgressRules = [...state.goalProgressRules.filter((r) => r.goalId !== id)];

        if (input.linkMissions) {
          goalProgressRules.push({
            id: genId(),
            goalId: id,
            source: 'mission',
            matchType: 'keyword',
            matchValue: keywords,
            incrementValue: 1,
            enabled: true,
          });
        }
        if (input.linkLifeLog) {
          goalProgressRules.push({
            id: genId(),
            goalId: id,
            source: 'life_log',
            matchType: 'keyword',
            matchValue: keywords,
            incrementValue: input.metricType === 'duration_minutes' ? 0 : 1,
            enabled: true,
          });
        }

        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: input.title.trim(),
                  emoji: input.emoji,
                  category: input.category,
                  metricType: input.metricType,
                  targetValue: input.targetValue,
                  unit: input.unit.trim() || g.unit,
                  deadlineDate: input.deadlineDate,
                  motivationNote: input.motivationNote?.trim() || undefined,
                }
              : g
          ),
          goalProgressRules,
        }));
      },

      deleteLifeGoal: (id) => {
        set((s) => {
          const goalActions = s.goalDailyActions.filter((a) => a.goalId === id);
          const actionIds = new Set(goalActions.map((a) => a.id));
          const missionTaskIds = new Set(
            goalActions.flatMap((a) => (a.missionTaskId ? [a.missionTaskId] : []))
          );

          const dayTasks: Record<string, DayTask[]> = {};
          for (const [date, tasks] of Object.entries(s.dayTasks)) {
            const filtered = tasks.filter(
              (t) =>
                t.goalId !== id &&
                !missionTaskIds.has(t.id) &&
                !(t.goalDailyActionId && actionIds.has(t.goalDailyActionId))
            );
            if (filtered.length > 0) dayTasks[date] = filtered;
          }

          return {
            lifeGoals: s.lifeGoals.filter((g) => g.id !== id),
            goalWeeklyTargets: s.goalWeeklyTargets.filter((w) => w.goalId !== id),
            goalDailyActions: s.goalDailyActions.filter((a) => a.goalId !== id),
            goalProgressRules: s.goalProgressRules.filter((r) => r.goalId !== id),
            goalProgressEntries: s.goalProgressEntries.filter((e) => e.goalId !== id),
            goalHealthSnapshots: s.goalHealthSnapshots.filter((h) => h.goalId !== id),
            dayTasks,
          };
        });
      },

      incrementGoalProgress: (goalId, amount, meta) => {
        if (amount <= 0) return;
        const today = meta.date ?? format(new Date(), 'yyyy-MM-dd');
        const state = get();
        const goal = state.lifeGoals.find((g) => g.id === goalId);
        if (!goal || goal.status !== 'active') return;

        if (meta.sourceId) {
          const dup = state.goalProgressEntries.some(
            (e) => e.goalId === goalId && e.sourceId === meta.sourceId
          );
          if (dup) return;
        }

        const entry: GoalProgressEntry = {
          id: genId(),
          goalId,
          amount,
          date: today,
          source: meta.source,
          sourceId: meta.sourceId,
          note: meta.note,
          createdAt: new Date().toISOString(),
        };

        let completedActionTitles: string[] = [];

        set((s) => {
          const entries = [...s.goalProgressEntries, entry];
          let lifeGoals = s.lifeGoals.map((g) => {
            if (g.id !== goalId) return g;
            const updated = {
              ...g,
              currentValue: recomputeGoalCurrentValue(goalId, entries),
            };
            return checkAndAwardGoalMilestones(updated, get().awardXp);
          });

          const sync = syncDailyActionsFromDayProgress(
            s.goalDailyActions,
            entries,
            goalId,
            today
          );
          completedActionTitles = sync.newlyCompleted;
          const goalDailyActions = sync.actions;

          const weekStart = getWeekStart(new Date());
          const weeklyTarget = s.goalWeeklyTargets.find(
            (w) => w.goalId === goalId && w.weekStart === weekStart
          );
          let goalWeeklyTargets = s.goalWeeklyTargets;
          if (weeklyTarget) {
            const weekEntries = entries.filter(
              (e) =>
                e.goalId === goalId &&
                e.date >= weekStart &&
                e.date <= format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
            );
            const weekActual = weekEntries.reduce((sum, e) => sum + e.amount, 0);
            goalWeeklyTargets = s.goalWeeklyTargets.map((w) =>
              w.id === weeklyTarget.id ? { ...w, actualValue: weekActual } : w
            );
          }

          const updatedGoal = lifeGoals.find((g) => g.id === goalId)!;
          const health = computeGoalHealth(
            updatedGoal,
            entries,
            today,
            weeklyTarget?.targetValue ?? 0,
            weeklyTarget
              ? entries
                  .filter(
                    (e) =>
                      e.goalId === goalId &&
                      e.date >= weekStart &&
                      e.date <= format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
                  )
                  .reduce((sum, e) => sum + e.amount, 0)
              : 0
          );
          const goalHealthSnapshots = [
            ...s.goalHealthSnapshots.filter(
              (h) => !(h.goalId === goalId && h.date === today)
            ),
            health,
          ].slice(-500);

          return {
            goalProgressEntries: entries,
            lifeGoals,
            goalDailyActions,
            goalWeeklyTargets,
            goalHealthSnapshots,
          };
        });

        for (const title of completedActionTitles) {
          get().awardXp(GOAL_XP.DAILY_ACTION_COMPLETE, title);
        }

        if (meta.source === 'manual') {
          get().awardXp(GOAL_XP.MANUAL_PROGRESS, goal.title);
        }
      },

      addManualGoalProgress: (goalId, amount = 1, note) => {
        get().incrementGoalProgress(goalId, amount, { source: 'manual', note });
      },

      deleteGoalProgressEntry: (entryId) => {
        const state = get();
        const entry = state.goalProgressEntries.find((e) => e.id === entryId);
        if (!entry || entry.source !== 'manual') return;

        const goalId = entry.goalId;
        const goal = state.lifeGoals.find((g) => g.id === goalId);
        if (!goal) return;

        const today = format(new Date(), 'yyyy-MM-dd');
        const weekStart = getWeekStart(new Date());

        set((s) => {
          const entries = s.goalProgressEntries.filter((e) => e.id !== entryId);
          const newCurrentValue = recomputeGoalCurrentValue(goalId, entries);

          let lifeGoals = s.lifeGoals.map((g) => {
            if (g.id !== goalId) return g;
            const updated: LifeGoal = {
              ...g,
              currentValue: newCurrentValue,
            };
            if (updated.status === 'completed' && newCurrentValue < updated.targetValue) {
              return {
                ...updated,
                status: 'active' as const,
                completedAt: undefined,
              };
            }
            return updated;
          });

          const { actions: goalDailyActions } = syncDailyActionsFromDayProgress(
            s.goalDailyActions,
            entries,
            goalId,
            entry.date
          );

          const weeklyTarget = s.goalWeeklyTargets.find(
            (w) => w.goalId === goalId && w.weekStart === weekStart
          );
          let goalWeeklyTargets = s.goalWeeklyTargets;
          if (weeklyTarget) {
            const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');
            const weekActual = entries
              .filter(
                (e) => e.goalId === goalId && e.date >= weekStart && e.date <= weekEnd
              )
              .reduce((sum, e) => sum + e.amount, 0);
            goalWeeklyTargets = s.goalWeeklyTargets.map((w) =>
              w.id === weeklyTarget.id ? { ...w, actualValue: weekActual } : w
            );
          }

          const updatedGoal = lifeGoals.find((g) => g.id === goalId)!;
          const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');
          const weekActual = entries
            .filter(
              (e) => e.goalId === goalId && e.date >= weekStart && e.date <= weekEnd
            )
            .reduce((sum, e) => sum + e.amount, 0);
          const health = computeGoalHealth(
            updatedGoal,
            entries,
            today,
            weeklyTarget?.targetValue ?? 0,
            weekActual
          );
          const goalHealthSnapshots = [
            ...s.goalHealthSnapshots.filter(
              (h) => !(h.goalId === goalId && h.date === today)
            ),
            health,
          ].slice(-500);

          return {
            goalProgressEntries: entries,
            lifeGoals,
            goalDailyActions,
            goalWeeklyTargets,
            goalHealthSnapshots,
          };
        });
      },

      ensureWeeklyTargetsForActiveGoals: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const weekStart = getWeekStart(new Date());
        const state = get();
        let dirty = false;
        const weeklyTargets = [...state.goalWeeklyTargets];
        const dailyActions = [...state.goalDailyActions];
        const dayTasks = { ...state.dayTasks };

        for (const goal of state.lifeGoals.filter((g) => g.status === 'active')) {
          const hasWeek = weeklyTargets.some(
            (w) => w.goalId === goal.id && w.weekStart === weekStart
          );
          if (hasWeek) continue;
          dirty = true;
          const remaining = Math.max(0, goal.targetValue - goal.currentValue);
          const weeklyTarget = generateWeeklyTarget(
            goal.id,
            remaining,
            goal.deadlineDate,
            today
          );
          weeklyTargets.push(weeklyTarget);
          const newActions = generateDailyActionsForWeek(
            goal.id,
            weeklyTarget,
            goal.title,
            goal.unit,
            today
          );
          for (const action of newActions) {
            const exists = dailyActions.some(
              (a) => a.goalId === goal.id && a.date === action.date
            );
            if (exists) continue;
            const taskId = genId();
            action.missionTaskId = taskId;
            dailyActions.push(action);
            const tasks = dayTasks[action.date] ?? [];
            dayTasks[action.date] = [
              ...tasks,
              {
                id: taskId,
                date: action.date,
                title: action.title,
                done: false,
                order: tasks.length,
                goalId: goal.id,
                goalDailyActionId: action.id,
              },
            ];
          }
        }

        if (dirty) {
          set({
            goalWeeklyTargets: weeklyTargets,
            goalDailyActions: dailyActions,
            dayTasks,
          });
        }
      },

      evaluateGoalProgressFromMission: (task, wasDone, nowDone) => {
        if (!nowDone || wasDone) return;
        const rules = get().goalProgressRules.filter(
          (r) => r.enabled && r.source === 'mission'
        );
        for (const rule of rules) {
          if (matchesProgressRule(rule, { title: task.title })) {
            get().incrementGoalProgress(rule.goalId, rule.incrementValue, {
              source: 'mission',
              sourceId: task.id,
              note: task.title,
              date: task.date,
            });
          }
        }
      },

      evaluateGoalProgressFromLifeLog: (log) => {
        const date = format(parseISO(log.startTime), 'yyyy-MM-dd');
        const rules = get().goalProgressRules.filter(
          (r) => r.enabled && r.source === 'life_log'
        );
        for (const rule of rules) {
          const goal = get().lifeGoals.find((g) => g.id === rule.goalId);
          if (!goal || goal.status !== 'active') continue;
          if (
            matchesProgressRule(rule, {
              title: log.title,
              category: log.category,
            })
          ) {
            const amount =
              goal.metricType === 'duration_minutes' ? log.duration : rule.incrementValue;
            get().incrementGoalProgress(rule.goalId, amount, {
              source: 'life_log',
              sourceId: log.id,
              note: log.title,
              date,
            });
          }
        }
      },

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
          aiSettings: { enabled: false },
          forgotToStopState: { lastPromptDate: null, thresholdHours: 4 },
          buddySettings: { enabled: false, userName: 'Vijay', lockScreenListen: false },
          pendingStopFromNotification: false,
          notificationState: {
            date: '',
            sentCount: 0,
            sentTypes: [],
          },
          lifeGoals: [],
          goalWeeklyTargets: [],
          goalDailyActions: [],
          goalProgressRules: [],
          goalProgressEntries: [],
          goalHealthSnapshots: [],
        }),
    }),
    {
      name: 'lifegame-store',
      version: 1,
      migrate: (persisted: unknown) => {
        const state = persisted as {
          aiSettings?: { enabled?: boolean; apiKey?: string };
        };
        if (state?.aiSettings?.apiKey) {
          stashLegacyApiKey(state.aiSettings.apiKey);
          state.aiSettings = { enabled: state.aiSettings.enabled ?? false };
        }
        return persisted as AppState;
      },
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
        buddySettings: s.buddySettings,
        lifeGoals: s.lifeGoals,
        goalWeeklyTargets: s.goalWeeklyTargets,
        goalDailyActions: s.goalDailyActions,
        goalProgressRules: s.goalProgressRules,
        goalProgressEntries: s.goalProgressEntries,
        goalHealthSnapshots: s.goalHealthSnapshots,
      }),
    }
  )
);
