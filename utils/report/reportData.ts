import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useStore, type LifeLog, type LifeLogMood } from '@/store';
import {
  computeConsistencyTrend,
  computeMonthlyCompletionPercent,
  computeTotalDoneThisMonth,
} from '@/store';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { computeLifeAnalytics } from '@/utils/lifeLogAnalytics';
import { generateLifeInsights } from '@/utils/lifeLogInsights';
import {
  filterLogsInRange,
  formatDuration,
  formatDurationHours,
  getLogDateKey,
  sortLogsByStartDesc,
  sumDuration,
} from '@/utils/lifeLog';
import { progressColor } from './reportTheme';

export interface HabitRow {
  name: string;
  done: number;
  pct: number;
  color: string;
}

export interface MissionDay {
  key: string;
  label: string;
  total: number;
  done: number;
  pct: number;
  color: string;
}

export interface DailyLifeSummary {
  dateKey: string;
  label: string;
  activityCount: number;
  totalMinutes: number;
  topCategory: string;
}

export interface MoodCount {
  mood: LifeLogMood;
  count: number;
  color: string;
}

export interface WeeklyHours {
  label: string;
  minutes: number;
}

export interface ReportData {
  monthStart: string;
  monthLabel: string;
  generatedAt: string;
  daysInMonth: number;
  dates: Date[];
  totalHabits: number;
  totalHabitCompletions: number;
  monthlyHabitPct: number;
  habitRows: HabitRow[];
  consistencyTrend: { day: number; count: number }[];
  missionDaily: MissionDay[];
  avgMissionPct: number;
  bestMissionDay: MissionDay | null;
  worstMissionDay: MissionDay | null;
  monthLogs: LifeLog[];
  totalLoggedMinutes: number;
  lifeConsistencyScore: number;
  lifeMetrics: ReturnType<typeof computeLifeAnalytics>;
  lifeInsights: string[];
  dailySummaries: DailyLifeSummary[];
  activityLogs: LifeLog[];
  activityLogsTotal: number;
  activityLogsTruncated: boolean;
  focusSessions: LifeLog[];
  moodCounts: MoodCount[];
  weeklyHours: WeeklyHours[];
}

const MOOD_COLORS: Record<LifeLogMood, string> = {
  happy: '#22c55e',
  calm: '#60a5fa',
  stressed: '#ef4444',
  bored: '#a3a3a3',
  tired: '#a855f7',
};

const ACTIVITY_LOG_LIMIT = 80;

function monthDates(monthStart: string): Date[] {
  const start = startOfMonth(new Date(monthStart + 'T12:00:00'));
  const end = endOfMonth(start);
  const out: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) out.push(new Date(d));
  return out;
}

function topCategoryForLogs(logs: LifeLog[]): string {
  if (logs.length === 0) return '—';
  const map = new Map<string, number>();
  for (const log of logs) {
    map.set(log.category, (map.get(log.category) ?? 0) + log.duration);
  }
  let best = '';
  let bestMin = 0;
  for (const [cat, min] of map) {
    if (min > bestMin) {
      bestMin = min;
      best = cat;
    }
  }
  return getCategoryById(best)?.label ?? best;
}

function buildWeeklyHours(logs: LifeLog[], monthStart: string): WeeklyHours[] {
  const start = startOfMonth(new Date(monthStart + 'T12:00:00'));
  const end = endOfMonth(start);
  const weeks: WeeklyHours[] = [];
  let weekStart = startOfWeek(start, { weekStartsOn: 1 });

  while (weekStart <= end) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const rangeStart = weekStart < start ? start : weekStart;
    const rangeEnd = weekEnd > end ? end : weekEnd;
    const weekLogs = filterLogsInRange(logs, rangeStart, rangeEnd);
    weeks.push({
      label: `W${weeks.length + 1} (${format(rangeStart, 'd')}-${format(rangeEnd, 'd MMM')})`,
      minutes: sumDuration(weekLogs),
    });
    weekStart = addDays(weekEnd, 1);
  }
  return weeks;
}

export function buildReportData(monthStart: string): ReportData {
  const s = useStore.getState();
  const dates = monthDates(monthStart);
  const monthEnd = endOfMonth(new Date(monthStart + 'T12:00:00'));
  const monthLabel = format(new Date(monthStart + 'T12:00:00'), 'MMMM yyyy');
  const generatedAt = format(new Date(), "MMM d, yyyy 'at' h:mm a");

  const habitRows: HabitRow[] = s.habits
    .map((h) => {
      let done = 0;
      for (const d of dates) {
        const key = format(d, 'yyyy-MM-dd');
        if ((s.completions[key] ?? []).includes(h.id)) done++;
      }
      const pct = dates.length ? Math.round((done / dates.length) * 100) : 0;
      return {
        name: `${h.emoji} ${h.name}`,
        done,
        pct,
        color: progressColor(pct),
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const missionDaily: MissionDay[] = dates.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const tasks = s.dayTasks[key] ?? [];
    const done = tasks.filter((t) => t.done).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return {
      key,
      label: format(d, 'dd MMM'),
      total: tasks.length,
      done,
      pct,
      color: progressColor(pct),
    };
  });

  const withTasks = missionDaily.filter((d) => d.total > 0);
  const avgMissionPct = missionDaily.length
    ? Math.round(missionDaily.reduce((acc, d) => acc + d.pct, 0) / missionDaily.length)
    : 0;
  const bestMissionDay =
    withTasks.length > 0 ? [...withTasks].sort((a, b) => b.pct - a.pct)[0] : null;
  const worstMissionDay =
    withTasks.length > 0 ? [...withTasks].sort((a, b) => a.pct - b.pct)[0] : null;

  const monthLogs = filterLogsInRange(
    s.lifeLogs,
    startOfMonth(new Date(monthStart + 'T12:00:00')),
    monthEnd
  );
  const lifeMetrics = computeLifeAnalytics(s.lifeLogs, monthEnd);
  const lifeInsights = generateLifeInsights(s.lifeLogs, monthEnd);

  const dailySummaries: DailyLifeSummary[] = dates
    .map((d) => {
      const dateKey = format(d, 'yyyy-MM-dd');
      const dayLogs = monthLogs.filter((l) => getLogDateKey(l) === dateKey);
      return {
        dateKey,
        label: format(d, 'EEE, dd MMM'),
        activityCount: dayLogs.length,
        totalMinutes: sumDuration(dayLogs),
        topCategory: topCategoryForLogs(dayLogs),
      };
    })
    .filter((d) => d.activityCount > 0);

  const sortedLogs = sortLogsByStartDesc(monthLogs);
  const activityLogsTotal = sortedLogs.length;
  const activityLogsTruncated = activityLogsTotal > ACTIVITY_LOG_LIMIT;
  const activityLogs = activityLogsTruncated
    ? sortedLogs.slice(0, ACTIVITY_LOG_LIMIT)
    : sortedLogs;

  const focusSessions = sortedLogs.filter(
    (l) => l.category === 'deep-work' || l.category === 'learning'
  );

  const moodMap = new Map<LifeLogMood, number>();
  for (const log of monthLogs) {
    if (log.mood) moodMap.set(log.mood, (moodMap.get(log.mood) ?? 0) + 1);
  }
  const moodCounts: MoodCount[] = (['happy', 'calm', 'stressed', 'bored', 'tired'] as LifeLogMood[])
    .filter((m) => (moodMap.get(m) ?? 0) > 0)
    .map((m) => ({
      mood: m,
      count: moodMap.get(m) ?? 0,
      color: MOOD_COLORS[m],
    }));

  return {
    monthStart,
    monthLabel,
    generatedAt,
    daysInMonth: getDate(monthEnd),
    dates,
    totalHabits: s.habits.length,
    totalHabitCompletions: computeTotalDoneThisMonth(s.completions, monthStart),
    monthlyHabitPct: computeMonthlyCompletionPercent(s.habits, s.completions, monthStart),
    habitRows,
    consistencyTrend: computeConsistencyTrend(s.completions, monthStart),
    missionDaily,
    avgMissionPct,
    bestMissionDay,
    worstMissionDay,
    monthLogs,
    totalLoggedMinutes: sumDuration(monthLogs),
    lifeConsistencyScore: lifeMetrics.consistencyScore,
    lifeMetrics,
    lifeInsights,
    dailySummaries,
    activityLogs,
    activityLogsTotal,
    activityLogsTruncated,
    focusSessions,
    moodCounts,
    weeklyHours: buildWeeklyHours(monthLogs, monthStart),
  };
}

export { formatDuration, formatDurationHours };
