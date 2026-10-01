import type { Habit } from '@/store';

export const EMPTY_HABITS: Habit[] = [];

/** First-of-month key, same shape as store `currentMonth` (`yyyy-MM-dd`). */
export function monthKeyFromDate(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  if (!y || !m) return dateStr;
  return `${y}-${m}-01`;
}

export function dateIsInMonth(dateStr: string, monthKey: string): boolean {
  return monthKeyFromDate(dateStr) === monthKey;
}

export function cloneHabits(habits: Habit[]): Habit[] {
  return habits.map((habit) => ({
    ...habit,
    activeDays: habit.activeDays ? [...habit.activeDays] : undefined,
  }));
}

export function habitsForMonth(
  habitsByMonth: Record<string, Habit[]>,
  monthKey: string
): Habit[] {
  return habitsByMonth[monthKey] ?? EMPTY_HABITS;
}

export function addHabitToMonth(
  habitsByMonth: Record<string, Habit[]>,
  monthKey: string,
  habit: Habit
): Record<string, Habit[]> {
  const list = habitsByMonth[monthKey] ?? [];
  return { ...habitsByMonth, [monthKey]: [...list, habit] };
}

export function updateHabitInMonth(
  habitsByMonth: Record<string, Habit[]>,
  monthKey: string,
  habitId: string,
  patch: Partial<Omit<Habit, 'id' | 'order'>> & { activeDays?: number[] }
): Record<string, Habit[]> {
  const list = habitsByMonth[monthKey] ?? [];
  return {
    ...habitsByMonth,
    [monthKey]: list.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            ...patch,
            activeDays: patch.activeDays !== undefined ? patch.activeDays : habit.activeDays,
          }
        : habit
    ),
  };
}

export function deleteHabitInMonth(
  habitsByMonth: Record<string, Habit[]>,
  completions: Record<string, string[]>,
  monthKey: string,
  habitId: string
): { habitsByMonth: Record<string, Habit[]>; completions: Record<string, string[]> } {
  const list = (habitsByMonth[monthKey] ?? []).filter((h) => h.id !== habitId);
  const nextCompletions = { ...completions };
  for (const date of Object.keys(nextCompletions)) {
    if (!dateIsInMonth(date, monthKey)) continue;
    nextCompletions[date] = nextCompletions[date].filter((hid) => hid !== habitId);
    if (nextCompletions[date].length === 0) delete nextCompletions[date];
  }
  return {
    habitsByMonth: { ...habitsByMonth, [monthKey]: list },
    completions: nextCompletions,
  };
}

export function copyHabitsToMonth(
  habitsByMonth: Record<string, Habit[]>,
  fromMonth: string,
  toMonth: string
): Record<string, Habit[]> {
  const source = habitsByMonth[fromMonth] ?? [];
  return { ...habitsByMonth, [toMonth]: cloneHabits(source) };
}

export function monthsFromCompletions(
  completions: Record<string, string[]>,
  extraMonth?: string
): string[] {
  const months = new Set<string>();
  if (extraMonth) months.add(monthKeyFromDate(extraMonth));
  for (const date of Object.keys(completions)) {
    months.add(monthKeyFromDate(date));
  }
  return [...months];
}

export function seedHabitsByMonth(
  legacyHabits: Habit[],
  completions: Record<string, string[]>,
  currentMonth: string
): Record<string, Habit[]> {
  const months = monthsFromCompletions(completions, currentMonth);
  if (months.length === 0) months.push(currentMonth);
  const habitsByMonth: Record<string, Habit[]> = {};
  for (const month of months) {
    habitsByMonth[month] = cloneHabits(legacyHabits);
  }
  return habitsByMonth;
}
