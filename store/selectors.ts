import { addDays, differenceInCalendarDays, endOfMonth, format, getDate } from 'date-fns';

type HabitLike = { id: string; name: string };

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
    const dates = Object.entries(completions)
      .filter(([, ids]) => ids.includes(habit.id))
      .map(([d]) => d)
      .sort();
    let streak = 0;
    let maxStreak = 0;
    let prev: string | null = null;
    for (const d of dates) {
      streak =
        prev && differenceInCalendarDays(new Date(d), new Date(prev)) === 1 ? streak + 1 : 1;
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
