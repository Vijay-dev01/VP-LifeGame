import { format, isThisMonth, isThisWeek, parseISO } from 'date-fns';
import type { LifeLog, LifeLogMood } from '@/store';
import { getCategoryById } from '@/constants/lifeLogCategories';

export function calcDurationMinutes(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDurationHours(minutes: number): string {
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function getTimerElapsedSeconds(startTime: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
}

export function formatTimerElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getLogDateKey(log: LifeLog): string {
  return format(parseISO(log.startTime), 'yyyy-MM-dd');
}

export function sortLogsByStartDesc(logs: LifeLog[]): LifeLog[] {
  return [...logs].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function filterLogsInRange(logs: LifeLog[], start: Date, end: Date): LifeLog[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return logs.filter((log) => {
    const t = new Date(log.startTime).getTime();
    return t >= startMs && t <= endMs;
  });
}

export function sumDuration(logs: LifeLog[]): number {
  return logs.reduce((sum, log) => sum + log.duration, 0);
}

export function sumDurationByCategory(logs: LifeLog[], categoryId: string): number {
  return sumDuration(logs.filter((l) => l.category === categoryId));
}

export function sumDurationWeekly(logs: LifeLog[]): number {
  return sumDuration(logs.filter((l) => isThisWeek(parseISO(l.startTime))));
}

export function sumDurationMonthly(logs: LifeLog[]): number {
  return sumDuration(logs.filter((l) => isThisMonth(parseISO(l.startTime))));
}

export function makeActivityKey(category: string, title: string): string {
  return `${category}|${title.trim()}`;
}

export function parseActivityKey(key: string): { category: string; title: string } {
  const idx = key.indexOf('|');
  if (idx === -1) return { category: 'deep-work', title: key };
  return { category: key.slice(0, idx), title: key.slice(idx + 1) };
}

export function pushRecentKey(keys: string[], category: string, title: string): string[] {
  const key = makeActivityKey(category, title);
  const filtered = keys.filter((k) => k !== key);
  return [key, ...filtered].slice(0, 5);
}

export const MOOD_EMOJI: Record<LifeLogMood, string> = {
  happy: '😊',
  calm: '😌',
  stressed: '😰',
  bored: '😐',
  tired: '😴',
};

export const MOODS: LifeLogMood[] = ['happy', 'calm', 'stressed', 'bored', 'tired'];

export function validateLifeLogTimes(startTime: string, endTime: string): string | null {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Invalid date/time';
  if (start >= end) return 'End time must be after start time';
  return null;
}

export function getCategoryLabel(categoryId: string): string {
  return getCategoryById(categoryId)?.label ?? categoryId;
}
