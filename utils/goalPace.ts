import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { GoalPaceStatus, LifeGoal } from '@/store/goalTypes';
import type { GoalProgressEntry } from '@/store/goalTypes';

export function getDaysRemaining(goal: LifeGoal, today: string): number | null {
  if (!goal.deadlineDate) return null;
  const days = differenceInCalendarDays(parseISO(goal.deadlineDate), parseISO(today));
  return Math.max(0, days);
}

export function getExpectedProgress(goal: LifeGoal, today: string): number {
  if (goal.currentValue >= goal.targetValue) return goal.targetValue;
  if (!goal.deadlineDate) {
    const elapsed = Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(goal.startDate)) + 1);
    const weeklyRate = goal.targetValue / Math.max(1, Math.ceil(elapsed / 7));
    return Math.min(goal.targetValue, weeklyRate * Math.ceil(elapsed / 7));
  }
  const totalDays =
    differenceInCalendarDays(parseISO(goal.deadlineDate), parseISO(goal.startDate)) + 1;
  if (totalDays <= 0) return goal.targetValue;
  const elapsed = Math.max(0, differenceInCalendarDays(parseISO(today), parseISO(goal.startDate)) + 1);
  return Math.min(goal.targetValue, (elapsed / totalDays) * goal.targetValue);
}

export function getCurrentDailyRate(
  entries: GoalProgressEntry[],
  goalId: string,
  today: string,
  days = 7
): number {
  const cutoff = parseISO(today);
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = entries.filter((e) => e.goalId === goalId && e.date >= cutoffStr && e.date <= today);
  const total = recent.reduce((sum, e) => sum + e.amount, 0);
  return total / days;
}

export function getRequiredDailyRate(goal: LifeGoal, today: string): number {
  const remaining = goal.targetValue - goal.currentValue;
  if (remaining <= 0) return 0;
  const daysLeft = getDaysRemaining(goal, today);
  if (daysLeft === null) return remaining / 7;
  if (daysLeft <= 0) return remaining;
  return remaining / daysLeft;
}

export function getPaceStatus(goal: LifeGoal, today: string): GoalPaceStatus {
  if (goal.currentValue >= goal.targetValue || goal.status === 'completed') return 'completed';
  const expected = getExpectedProgress(goal, today);
  if (expected <= 0) return 'on_track';
  const ratio = goal.currentValue / expected;
  if (ratio >= 1.1) return 'ahead';
  if (ratio >= 0.9) return 'on_track';
  if (ratio >= 0.7) return 'behind';
  return 'at_risk';
}

export function formatPaceHint(
  goal: LifeGoal,
  today: string,
  currentDailyRate: number
): string {
  const status = getPaceStatus(goal, today);
  if (status === 'completed') return 'Goal complete!';
  const required = getRequiredDailyRate(goal, today);
  const unit = goal.unit;
  if (status === 'ahead') return 'Ahead of schedule — keep it up';
  if (status === 'on_track') return `On pace · ~${required.toFixed(1)} ${unit}/day needed`;
  if (status === 'behind') {
    const gap = required - currentDailyRate;
    return gap > 0 ? `Need +${gap.toFixed(1)} ${unit}/day` : `Need ~${required.toFixed(1)} ${unit}/day`;
  }
  return `At risk · need ${required.toFixed(1)} ${unit}/day (doing ${currentDailyRate.toFixed(1)})`;
}
