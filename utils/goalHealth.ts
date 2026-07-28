import type { GoalHealthSnapshot, GoalProgressEntry, LifeGoal } from '@/store/goalTypes';
import {
  getCurrentDailyRate,
  getDaysRemaining,
  getExpectedProgress,
  getPaceStatus,
  getRequiredDailyRate,
} from '@/utils/goalPace';

function paceScore(goal: LifeGoal, today: string): number {
  const expected = getExpectedProgress(goal, today);
  if (expected <= 0) return 100;
  const ratio = goal.currentValue / expected;
  return Math.min(100, Math.round(ratio * 100));
}

function weeklyScore(
  goal: LifeGoal,
  weeklyTarget: number,
  weeklyActual: number
): number {
  if (weeklyTarget <= 0) return 100;
  return Math.min(100, Math.round((weeklyActual / weeklyTarget) * 100));
}

function consistencyScore(entries: GoalProgressEntry[], goalId: string, today: string): number {
  const activeDays = new Set<string>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (entries.some((e) => e.goalId === goalId && e.date === key)) {
      activeDays.add(key);
    }
  }
  return Math.round((activeDays.size / 14) * 100);
}

export function computeGoalHealth(
  goal: LifeGoal,
  entries: GoalProgressEntry[],
  today: string,
  weeklyTarget = 0,
  weeklyActual = 0
): GoalHealthSnapshot {
  const pace = paceScore(goal, today);
  const weekly = weeklyScore(goal, weeklyTarget, weeklyActual);
  const consistency = consistencyScore(entries, goal.id, today);
  const score = Math.round(pace * 0.6 + weekly * 0.25 + consistency * 0.15);
  const currentDailyRate = getCurrentDailyRate(entries, goal.id, today);
  const requiredDailyRate = getRequiredDailyRate(goal, today);

  return {
    goalId: goal.id,
    date: today,
    score: Math.min(100, Math.max(0, score)),
    paceStatus: getPaceStatus(goal, today),
    daysRemaining: getDaysRemaining(goal, today),
    requiredDailyRate,
    currentDailyRate,
  };
}
