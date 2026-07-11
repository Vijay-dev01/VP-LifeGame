import { subDays } from 'date-fns';
import type { DistractionType, NightlyReflection } from '@/store';

const DISTRACTION_LABELS: Record<DistractionType, string> = {
  meeting: 'Meeting',
  phone: 'Phone',
  youtube: 'YouTube',
  nothing: 'Nothing',
  other: 'Other',
};

export interface ReflectionInsight {
  topDistraction: DistractionType | null;
  topLabel: string;
  count: number;
  totalDays: number;
  weekDelta: number;
}

export function computeReflectionInsights(reflections: NightlyReflection[]): ReflectionInsight {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recent = reflections.filter((r) => new Date(r.date) >= thirtyDaysAgo);
  const lastWeek = reflections.filter((r) => new Date(r.date) >= subDays(new Date(), 7));
  const prevWeek = reflections.filter((r) => {
    const d = new Date(r.date);
    return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
  });

  const counts = new Map<DistractionType, number>();
  for (const r of recent) {
    if (r.distraction === 'nothing') continue;
    counts.set(r.distraction, (counts.get(r.distraction) ?? 0) + 1);
  }

  let topDistraction: DistractionType | null = null;
  let maxCount = 0;
  for (const [type, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      topDistraction = type;
    }
  }

  const weekTop = getTopForPeriod(lastWeek);
  const prevTop = getTopForPeriod(prevWeek);
  const weekDelta = weekTop && prevTop && weekTop === prevTop ? maxCount - (counts.get(weekTop) ?? 0) : 0;

  return {
    topDistraction,
    topLabel: topDistraction ? DISTRACTION_LABELS[topDistraction] : 'None yet',
    count: maxCount,
    totalDays: recent.length,
    weekDelta,
  };
}

function getTopForPeriod(reflections: NightlyReflection[]): DistractionType | null {
  const counts = new Map<DistractionType, number>();
  for (const r of reflections) {
    if (r.distraction === 'nothing') continue;
    counts.set(r.distraction, (counts.get(r.distraction) ?? 0) + 1);
  }
  let top: DistractionType | null = null;
  let max = 0;
  for (const [type, count] of counts) {
    if (count > max) {
      max = count;
      top = type;
    }
  }
  return top;
}

export function formatReflectionInsight(insight: ReflectionInsight): string {
  if (!insight.topDistraction || insight.count === 0) {
    return 'Keep answering nightly questions to discover your distraction patterns.';
  }
  return `Your biggest distraction this month: ${insight.topLabel} (${insight.count} days)`;
}
