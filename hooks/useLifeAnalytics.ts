import { useMemo } from 'react';
import { useStore } from '@/store';
import { computeLifeAnalytics } from '@/utils/lifeLogAnalytics';
import { generateLifeInsights } from '@/utils/lifeLogInsights';

export function useLifeAnalytics() {
  const logs = useStore((s) => s.lifeLogs);

  const metrics = useMemo(() => computeLifeAnalytics(logs), [logs]);
  const insights = useMemo(() => generateLifeInsights(logs), [logs]);

  return { metrics, insights, logs };
}
