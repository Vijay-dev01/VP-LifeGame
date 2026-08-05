import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import type { GoalDailyAction, GoalMetricType, GoalWeeklyTarget } from '@/store/goalTypes';
import { genId } from '@/utils/ids';
import { toDisplayGoalAmount } from '@/utils/goalUnits';

export function getWeekStart(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function computeWeeklyTargetValue(
  remaining: number,
  deadlineDate: string | null,
  today: string
): number {
  if (remaining <= 0) return 0;
  if (!deadlineDate) {
    return Math.max(1, Math.ceil(remaining / 4));
  }
  const daysLeft = differenceInCalendarDays(parseISO(deadlineDate), parseISO(today)) + 1;
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  return Math.max(1, Math.ceil(remaining / weeksLeft));
}

export function computeDailyTargetValue(weeklyTarget: number, workDaysPerWeek = 5): number {
  if (weeklyTarget <= 0) return 0;
  return Math.max(1, Math.ceil(weeklyTarget / workDaysPerWeek));
}

export function generateWeeklyTarget(
  goalId: string,
  remaining: number,
  deadlineDate: string | null,
  today: string
): GoalWeeklyTarget {
  return {
    id: genId(),
    goalId,
    weekStart: getWeekStart(parseISO(today)),
    targetValue: computeWeeklyTargetValue(remaining, deadlineDate, today),
    actualValue: 0,
  };
}

export function generateDailyActionsForWeek(
  goalId: string,
  weeklyTarget: GoalWeeklyTarget,
  goalTitle: string,
  unit: string,
  today: string,
  workDaysPerWeek = 5,
  metricType: GoalMetricType = 'count'
): GoalDailyAction[] {
  const dailyTarget = computeDailyTargetValue(weeklyTarget.targetValue, workDaysPerWeek);
  const displayDaily = toDisplayGoalAmount(dailyTarget, unit, metricType);
  const displayLabel =
    metricType === 'duration_minutes' && displayDaily % 1 !== 0
      ? displayDaily.toFixed(1)
      : String(Math.round(displayDaily));
  const actions: GoalDailyAction[] = [];
  const weekStart = parseISO(weeklyTarget.weekStart);

  for (let i = 0; i < 7; i++) {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
    if (date < today) continue;
    const isWorkDay = i < workDaysPerWeek;
    if (!isWorkDay && weeklyTarget.targetValue <= workDaysPerWeek) continue;

    actions.push({
      id: genId(),
      goalId,
      weeklyTargetId: weeklyTarget.id,
      date,
      title: `${goalTitle}: ${displayLabel} ${unit}`,
      targetValue: dailyTarget,
      actualValue: 0,
      done: false,
    });
  }
  return actions;
}
