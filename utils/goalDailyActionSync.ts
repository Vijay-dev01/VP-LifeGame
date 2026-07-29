import type { GoalDailyAction, GoalProgressEntry } from '@/store/goalTypes';

export function sumGoalProgressOnDate(
  entries: GoalProgressEntry[],
  goalId: string,
  date: string
): number {
  return entries
    .filter((e) => e.goalId === goalId && e.date === date)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Align daily action rows with total progress logged on that date. */
export function syncDailyActionsFromDayProgress(
  actions: GoalDailyAction[],
  entries: GoalProgressEntry[],
  goalId: string,
  date: string
): { actions: GoalDailyAction[]; newlyCompleted: string[] } {
  const dayTotal = sumGoalProgressOnDate(entries, goalId, date);
  let remaining = dayTotal;
  const newlyCompleted: string[] = [];

  const updated = actions.map((a) => {
    if (a.goalId !== goalId || a.date !== date) return a;
    const wasDone = a.done;
    const applied = Math.min(remaining, a.targetValue);
    remaining = Math.max(0, remaining - applied);
    const done = applied >= a.targetValue;
    if (!wasDone && done) newlyCompleted.push(a.title);
    return { ...a, actualValue: applied, done };
  });

  return { actions: updated, newlyCompleted };
}
