import type { GoalMetricType } from '@/store/goalTypes';

export function isHoursUnit(unit: string): boolean {
  const u = unit.trim().toLowerCase();
  return u === 'hour' || u === 'hours' || u === 'hr' || u === 'hrs' || u === 'h';
}

/** Convert user-facing amount to internal storage (minutes for duration). */
export function toStoredGoalAmount(
  displayValue: number,
  unit: string,
  metricType: GoalMetricType
): number {
  if (metricType !== 'duration_minutes') return displayValue;
  if (isHoursUnit(unit)) return Math.round(displayValue * 60);
  return displayValue;
}

/** Convert stored amount to user-facing display. */
export function toDisplayGoalAmount(
  storedValue: number,
  unit: string,
  metricType: GoalMetricType
): number {
  if (metricType !== 'duration_minutes') return storedValue;
  if (isHoursUnit(unit)) return Math.round((storedValue / 60) * 10) / 10;
  return storedValue;
}

export function formatGoalProgressLabel(
  storedValue: number,
  unit: string,
  metricType: GoalMetricType
): string {
  const display = toDisplayGoalAmount(storedValue, unit, metricType);
  const rounded =
    metricType === 'duration_minutes' && isHoursUnit(unit)
      ? display % 1 === 0
        ? String(display)
        : display.toFixed(1)
      : String(Math.round(display));
  return `${rounded} ${unit}`;
}
