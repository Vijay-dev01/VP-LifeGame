import { useMemo } from 'react';
import { useStore } from '@/store';
import {
  computeBestStreak,
  computeConsistencyTrend,
  computeMonthlyCompletionPercent,
  computeTotalDoneThisMonth,
} from '@/store/selectors';

export function useMonthlyStats() {
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const currentMonth = useStore((s) => s.currentMonth);

  return useMemo(
    () => ({
      totalDone: computeTotalDoneThisMonth(completions, currentMonth),
      bestStreak: computeBestStreak(habits, completions),
      monthlyPercent: computeMonthlyCompletionPercent(habits, completions, currentMonth),
      consistencyTrend: computeConsistencyTrend(completions, currentMonth),
    }),
    [habits, completions, currentMonth]
  );
}
