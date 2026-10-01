import { useMemo } from 'react';
import { useStore } from '@/store';
import {
  computeBestStreak,
  computeConsistencyTrend,
  computeMonthlyCompletionPercent,
  computeTotalDoneThisMonth,
} from '@/store/selectors';
import { EMPTY_HABITS } from '@/utils/habitsByMonth';

export function useMonthlyStats() {
  const habitsByMonth = useStore((s) => s.habitsByMonth);
  const completions = useStore((s) => s.completions);
  const currentMonth = useStore((s) => s.currentMonth);
  const habits = habitsByMonth[currentMonth] ?? EMPTY_HABITS;

  return useMemo(
    () => ({
      totalDone: computeTotalDoneThisMonth(completions, currentMonth),
      bestStreak: computeBestStreak(habits, completions, currentMonth),
      monthlyPercent: computeMonthlyCompletionPercent(habits, completions, currentMonth),
      consistencyTrend: computeConsistencyTrend(completions, currentMonth),
    }),
    [habits, completions, currentMonth]
  );
}
