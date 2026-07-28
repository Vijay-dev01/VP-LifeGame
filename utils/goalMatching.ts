import type { GoalProgressRule } from '@/store/goalTypes';

export function matchesKeyword(text: string, matchValue: string): boolean {
  const lower = text.toLowerCase();
  const keywords = matchValue
    .split('|')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  return keywords.some((kw) => lower.includes(kw));
}

export function matchesProgressRule(
  rule: GoalProgressRule,
  context: {
    title: string;
    category?: string;
    habitId?: string;
  }
): boolean {
  if (!rule.enabled) return false;

  switch (rule.matchType) {
    case 'keyword':
      return matchesKeyword(context.title, rule.matchValue);
    case 'category':
      return context.category?.toLowerCase() === rule.matchValue.toLowerCase();
    case 'exact_title':
      return context.title.toLowerCase().trim() === rule.matchValue.toLowerCase().trim();
    case 'habit_id':
      return context.habitId === rule.matchValue;
    default:
      return false;
  }
}

export function suggestKeywordsFromTitle(title: string): string {
  const lower = title.toLowerCase();
  const words = lower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['complete', 'apply', 'build', 'save', 'lose'].includes(w));
  if (words.length > 0) return words.slice(0, 3).join('|');
  const first = lower.split(/\s+/).find((w) => w.length > 2);
  return first ?? 'goal';
}
