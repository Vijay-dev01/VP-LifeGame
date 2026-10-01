import { useMemo } from 'react';
import { endOfMonth } from 'date-fns';
import { useStore } from '@/store';
import { computeLifeAnalytics } from '@/utils/lifeLogAnalytics';
import { generateLifeInsights } from '@/utils/lifeLogInsights';

export function useLifeAnalytics() {
  const logs = useStore((s) => s.lifeLogs);
  const currentMonth = useStore((s) => s.currentMonth);
  const now = useMemo(
    () => endOfMonth(new Date(currentMonth + 'T12:00:00')),
    [currentMonth]
  );

  const metrics = useMemo(() => computeLifeAnalytics(logs, now), [logs, now]);
  const insights = useMemo(() => generateLifeInsights(logs, now), [logs, now]);

  return { metrics, insights, logs };
}
