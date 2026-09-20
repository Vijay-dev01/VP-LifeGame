import { addDays, endOfMonth, format, getDate } from 'date-fns';
import {
  isHabitScheduledOn,
  nextScheduledDateStr,
  normalizeActiveDays,
  weekdayFromDateStr,
} from '@/utils/habitSchedule';

type HabitLike = { id: string; name: string; activeDays?: number[] };

function monthDates(currentMonth: string): Date[] {
  const start = new Date(currentMonth + 'T12:00:00');
  const end = endOfMonth(start);
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) dates.push(new Date(d));
  return dates;
}

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
  habits: HabitLike[],
  completions: Record<string, string[]>
): { days: number; habitName: string } {
  let bestDays = 0;
  let bestName = '';
  for (const habit of habits) {
    const activeDays = normalizeActiveDays(habit.activeDays);
    const dates = Object.entries(completions)
      .filter(
        ([d, ids]) => ids.includes(habit.id) && activeDays.includes(weekdayFromDateStr(d))
      )
      .map(([d]) => d)
      .sort();
    let streak = 0;
    let maxStreak = 0;
    let prev: string | null = null;
    for (const d of dates) {
      if (!prev) {
        streak = 1;
      } else {
        streak = nextScheduledDateStr(prev, activeDays) === d ? streak + 1 : 1;
      }
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
  habits: HabitLike[],
  completions: Record<string, string[]>,
  currentMonth: string
): number {
  const dates = monthDates(currentMonth);
  let possible = 0;
  let done = 0;
  for (const habit of habits) {
    for (const d of dates) {
      const key = format(d, 'yyyy-MM-dd');
      if (!isHabitScheduledOn(habit.activeDays, key)) continue;
      possible++;
      if ((completions[key] ?? []).includes(habit.id)) done++;
    }
  }
  if (possible === 0) return 0;
  return Math.round((done / possible) * 100);
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
  currentMonth: string,
  activeDays?: number[]
): number {
  const dates = monthDates(currentMonth);
  let scheduled = 0;
  let done = 0;
  for (const d of dates) {
    const key = format(d, 'yyyy-MM-dd');
    if (!isHabitScheduledOn(activeDays, key)) continue;
    scheduled++;
    if ((completions[key] ?? []).includes(habitId)) done++;
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}
