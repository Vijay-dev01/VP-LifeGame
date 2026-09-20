export const ALL_ACTIVE_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function normalizeActiveDays(days?: number[] | null): number[] {
  if (!days || days.length === 0) return [...ALL_ACTIVE_DAYS];
  const unique = [
    ...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
  ].sort((a, b) => a - b);
  return unique.length ? unique : [...ALL_ACTIVE_DAYS];
}

export function weekdayFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isHabitScheduledOn(activeDays: number[] | undefined, dateStr: string): boolean {
  return normalizeActiveDays(activeDays).includes(weekdayFromDateStr(dateStr));
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nextScheduledDateStr(fromDateStr: string, activeDays: number[]): string {
  const days = normalizeActiveDays(activeDays);
  const [y, m, d] = fromDateStr.split('-').map(Number);
  let cursor = new Date(y, m - 1, d + 1);
  for (let i = 0; i < 14; i++) {
    if (days.includes(cursor.getDay())) return formatLocalDate(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return formatLocalDate(cursor);
}
