import { formatLocalDate, normalizeActiveDays } from '@/utils/habitSchedule';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseTime(value?: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const m = TIME_RE.exec(value.trim());
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Local calendar datetime. Never parse `yyyy-MM-dd` with `new Date(iso)`. */
export function localDateTime(dateStr: string, timeStr: string): Date | null {
  const dm = DATE_RE.exec(dateStr);
  const tm = parseTime(timeStr);
  if (!dm || !tm) return null;
  return new Date(
    Number(dm[1]),
    Number(dm[2]) - 1,
    Number(dm[3]),
    tm.hour,
    tm.minute,
    0,
    0
  );
}

export function nextHabitReminderDates(
  activeDays: number[] | undefined,
  reminderTime: string,
  from: Date,
  horizonDays = 7
): { date: string; trigger: Date }[] {
  const days = normalizeActiveDays(activeDays);
  const parsed = parseTime(reminderTime);
  if (!parsed) return [];

  const out: { date: string; trigger: Date }[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < horizonDays; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (!days.includes(day.getDay())) continue;
    const trigger = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      parsed.hour,
      parsed.minute,
      0,
      0
    );
    if (trigger <= from) continue;
    out.push({ date: formatLocalDate(day), trigger });
  }
  return out;
}

export function planItemTriggerDate(date: string, time: string, now: Date): Date | null {
  const trigger = localDateTime(date, time);
  if (!trigger || trigger <= now) return null;
  return trigger;
}

export function upcomingPlanItemTriggers(
  items: { id: string; date: string; time: string; title: string; done?: boolean }[],
  now: Date
): { id: string; title: string; trigger: Date }[] {
  const out: { id: string; title: string; trigger: Date }[] = [];
  for (const item of items) {
    if (item.done) continue;
    const trigger = planItemTriggerDate(item.date, item.time, now);
    if (!trigger) continue;
    out.push({ id: item.id, title: item.title, trigger });
  }
  return out;
}
