import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';

export type BuddyCommand =
  | { type: 'wake' }
  | { type: 'start_timer'; category: string; title: string }
  | { type: 'stop_timer' }
  | { type: 'add_tasks'; date: 'tomorrow' | 'today'; titles: string[] }
  | { type: 'complete_task'; query: string };

const WAKE_PATTERN = /\bhey\s+budd?(y|ie|ee)?\b/i;
const START_PATTERN = /\b(started?|begin(?:ning)?|start)\b\s+(.+)/i;
const STOP_WITH_ACTIVITY = /\b(stopped?|stop|ended?|end|finish(?:ed)?)\b(?:\s+(?:the\s+)?(?:timer\s+)?(?:for\s+)?(.+))?/i;
const ADD_TASKS_PATTERN = /\badd(?:\s+to)?\s+(tomorrow|today)\b(.+)/i;
const COMPLETE_BEFORE = /^(.+?)\s+(?:complete|done)\.?$/i;
const COMPLETE_AFTER = /^(?:complete|mark|finish)\s+(.+?)(?:\s+(?:as\s+)?done)?\.?$/i;
const DONE_PREFIX = /^done\s+(.+?)\.?$/i;

function resolveActivity(phrase: string): { category: string; title: string } {
  const lower = phrase.toLowerCase().trim().replace(/\.$/, '');

  for (const cat of LIFE_LOG_CATEGORIES) {
    for (const example of cat.examples) {
      if (lower.includes(example.toLowerCase()) || lower === example.toLowerCase()) {
        return { category: cat.id, title: example };
      }
    }
    if (lower.includes(cat.label.toLowerCase())) {
      return { category: cat.id, title: cat.examples[0] ?? cat.label };
    }
  }

  if (lower.includes('code') || lower.includes('coding')) {
    return { category: 'deep-work', title: 'coding' };
  }
  if (lower.includes('read')) return { category: 'learning', title: 'reading' };
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('exercise')) {
    return { category: 'health', title: lower.includes('exercise') ? 'exercise' : 'gym' };
  }
  if (lower.includes('run')) return { category: 'health', title: 'running' };
  if (lower.includes('danc')) return { category: 'health', title: 'dancing' };
  if (lower.includes('meet')) return { category: 'shallow-work', title: 'meetings' };

  return { category: 'deep-work', title: lower || 'activity' };
}

export function splitTaskTitles(phrase: string): string[] {
  return phrase
    .replace(/\.$/, '')
    .split(/\s*,\s*|\s+and\s+|\s*&\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function containsWakePhrase(text: string): boolean {
  return WAKE_PATTERN.test(text);
}

export function parseBuddyCommand(transcript: string, options?: { allowWake?: boolean }): BuddyCommand | null {
  const text = transcript.trim();
  if (!text) return null;

  if (options?.allowWake !== false && containsWakePhrase(text)) {
    const withoutWake = text.replace(WAKE_PATTERN, '').trim();
    if (!withoutWake) return { type: 'wake' };
    const nested = parseBuddyCommand(withoutWake, { allowWake: false });
    return nested ?? { type: 'wake' };
  }

  const addMatch = ADD_TASKS_PATTERN.exec(text);
  if (addMatch) {
    const date = addMatch[1].toLowerCase() as 'tomorrow' | 'today';
    const titles = splitTaskTitles(addMatch[2]);
    if (titles.length) return { type: 'add_tasks', date, titles };
  }

  const completeBefore = COMPLETE_BEFORE.exec(text);
  if (completeBefore) {
    return { type: 'complete_task', query: completeBefore[1].trim() };
  }

  const completeAfter = COMPLETE_AFTER.exec(text);
  if (completeAfter) {
    return { type: 'complete_task', query: completeAfter[1].trim() };
  }

  const donePrefix = DONE_PREFIX.exec(text);
  if (donePrefix) {
    return { type: 'complete_task', query: donePrefix[1].trim() };
  }

  const startMatch = START_PATTERN.exec(text);
  if (startMatch) {
    const activity = resolveActivity(startMatch[2]);
    return { type: 'start_timer', ...activity };
  }

  const stopMatch = STOP_WITH_ACTIVITY.exec(text);
  if (stopMatch) {
    return { type: 'stop_timer' };
  }

  if (/^stop(?:\s+(?:the\s+)?timer)?\.?$/i.test(text)) {
    return { type: 'stop_timer' };
  }

  // Bare activity phrase e.g. "coding" while in command mode
  const bareActivity = resolveActivity(text);
  if (bareActivity.title !== 'activity' || text.length > 2) {
    const lower = text.toLowerCase();
    const isKnown =
      LIFE_LOG_CATEGORIES.some(
        (c) =>
          c.examples.some((e) => lower.includes(e)) ||
          lower.includes(c.label.toLowerCase())
      ) ||
      /\b(code|coding|read|run|danc|gym|meet)\b/i.test(text);
    if (isKnown) return { type: 'start_timer', ...bareActivity };
  }

  return null;
}

export const BUDDY_CONTEXTUAL_STRINGS = [
  'hey buddy',
  'tomorrow',
  'today',
  'complete',
  'done',
  'stop',
  'start',
  'running',
  'reading',
  'dancing',
  'coding',
  'add tomorrow',
  ...LIFE_LOG_CATEGORIES.flatMap((c) => [c.label, ...c.examples]),
];
