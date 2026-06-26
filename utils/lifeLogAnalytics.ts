import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import type { LifeLog } from '@/store';
import {
  DISTRACTION_CATEGORY_ID,
  PRODUCTIVE_CATEGORY_IDS,
  RECOVERY_CATEGORY_IDS,
} from '@/constants/lifeLogCategories';
import { filterLogsInRange, getLogDateKey, sumDuration, sumDurationByCategory } from './lifeLog';

export interface CategoryBreakdownItem {
  categoryId: string;
  minutes: number;
  percent: number;
}

export interface LifeAnalyticsMetrics {
  weekTotalMinutes: number;
  monthTotalMinutes: number;
  categoryBreakdown: CategoryBreakdownItem[];
  mostUsedCategory: string | null;
  avgDailyActivityCount: number;
  avgDeepWorkMinutesPerDay: number;
  avgDistractionMinutesPerDay: number;
  avgSleepMinutes: number;
  plannedRatio: number;
  focusScore: number;
  distractionScore: number;
  intentionalityScore: number;
  recoveryScore: number;
  consistencyScore: number;
}

function getWeekBounds(date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

function getLastWeekBounds(date = new Date()) {
  const lastWeek = subWeeks(date, 1);
  return {
    start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
    end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
  };
}

function getMonthBounds(date = new Date()) {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

function uniqueLoggedDays(logs: LifeLog[]): number {
  const days = new Set(logs.map(getLogDateKey));
  return days.size;
}

function computeAwakeTime(logs: LifeLog[]): number {
  const total = sumDuration(logs);
  const recovery = sumDuration(
    logs.filter((l) => RECOVERY_CATEGORY_IDS.includes(l.category as (typeof RECOVERY_CATEGORY_IDS)[number]))
  );
  const awake = total - recovery;
  return awake > 0 ? awake : total;
}

function categoryBreakdown(logs: LifeLog[]): CategoryBreakdownItem[] {
  const total = sumDuration(logs);
  if (total === 0) return [];
  const map = new Map<string, number>();
  for (const log of logs) {
    map.set(log.category, (map.get(log.category) ?? 0) + log.duration);
  }
  return Array.from(map.entries())
    .map(([categoryId, minutes]) => ({
      categoryId,
      minutes,
      percent: Math.round((minutes / total) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

function mostUsedCategory(breakdown: CategoryBreakdownItem[]): string | null {
  return breakdown[0]?.categoryId ?? null;
}

function avgPerLoggedDay(minutes: number, logs: LifeLog[]): number {
  const days = uniqueLoggedDays(logs);
  return days === 0 ? 0 : Math.round(minutes / days);
}

export function computeLifeAnalytics(logs: LifeLog[], now = new Date()): LifeAnalyticsMetrics {
  const week = getWeekBounds(now);
  const month = getMonthBounds(now);
  const weekLogs = filterLogsInRange(logs, week.start, week.end);
  const monthLogs = filterLogsInRange(logs, month.start, month.end);

  const weekTotalMinutes = sumDuration(weekLogs);
  const monthTotalMinutes = sumDuration(monthLogs);
  const breakdown = categoryBreakdown(monthLogs);

  const deepWorkWeek = sumDurationByCategory(weekLogs, 'deep-work');
  const distractionWeek = sumDurationByCategory(weekLogs, DISTRACTION_CATEGORY_ID);
  const recoveryWeek = sumDuration(
    weekLogs.filter((l) =>
      RECOVERY_CATEGORY_IDS.includes(l.category as (typeof RECOVERY_CATEGORY_IDS)[number])
    )
  );

  const awakeWeek = computeAwakeTime(weekLogs);
  const deepLearningWeek =
    sumDurationByCategory(weekLogs, 'deep-work') + sumDurationByCategory(weekLogs, 'learning');

  const plannedCount = monthLogs.filter((l) => l.intentType === 'planned').length;
  const totalCount = monthLogs.length;

  const monthDays = differenceInCalendarDays(month.end, month.start) + 1;
  const loggedDaysMonth = uniqueLoggedDays(monthLogs);

  const totalDayWeek = Math.min(sumDuration(weekLogs), 24 * 60 * 7);

  return {
    weekTotalMinutes,
    monthTotalMinutes,
    categoryBreakdown: breakdown,
    mostUsedCategory: mostUsedCategory(breakdown),
    avgDailyActivityCount:
      uniqueLoggedDays(weekLogs) === 0
        ? 0
        : Math.round((weekLogs.length / uniqueLoggedDays(weekLogs)) * 10) / 10,
    avgDeepWorkMinutesPerDay: avgPerLoggedDay(deepWorkWeek, weekLogs),
    avgDistractionMinutesPerDay: avgPerLoggedDay(distractionWeek, weekLogs),
    avgSleepMinutes: avgPerLoggedDay(recoveryWeek, weekLogs),
    plannedRatio: totalCount === 0 ? 0 : plannedCount / totalCount,
    focusScore: awakeWeek === 0 ? 0 : Math.round((deepLearningWeek / awakeWeek) * 100),
    distractionScore:
      awakeWeek === 0 ? 0 : Math.round((distractionWeek / awakeWeek) * 100),
    intentionalityScore: totalCount === 0 ? 0 : Math.round((plannedCount / totalCount) * 100),
    recoveryScore: totalDayWeek === 0 ? 0 : Math.round((recoveryWeek / totalDayWeek) * 100),
    consistencyScore: monthDays === 0 ? 0 : Math.round((loggedDaysMonth / monthDays) * 100),
  };
}

export function getLearningMinutesForWeek(logs: LifeLog[], date = new Date()): number {
  const { start, end } = getWeekBounds(date);
  return sumDurationByCategory(filterLogsInRange(logs, start, end), 'learning');
}

export function getLastWeekLearningMinutes(logs: LifeLog[]): number {
  const { start, end } = getLastWeekBounds();
  return sumDurationByCategory(filterLogsInRange(logs, start, end), 'learning');
}

export function getTodayLogs(logs: LifeLog[], now = new Date()): LifeLog[] {
  const key = format(now, 'yyyy-MM-dd');
  return logs.filter((l) => getLogDateKey(l) === key);
}

export function getProductiveMinutes(logs: LifeLog[]): number {
  return sumDuration(
    logs.filter((l) =>
      PRODUCTIVE_CATEGORY_IDS.includes(l.category as (typeof PRODUCTIVE_CATEGORY_IDS)[number])
    )
  );
}
