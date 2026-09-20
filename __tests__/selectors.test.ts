import assert from 'node:assert/strict';
import {
  computeBestStreak,
  computeHabitCompletionPercent,
  computeMonthlyCompletionPercent,
  computeTotalDoneThisMonth,
} from '../store/selectors';

const habits = [
  { id: 'h1', name: 'Run' },
  { id: 'h2', name: 'Read' },
];

const currentMonth = '2026-07-01';
const completions = {
  '2026-07-01': ['h1'],
  '2026-07-02': ['h1', 'h2'],
  '2026-07-03': ['h1'],
};

assert.equal(computeTotalDoneThisMonth(completions, currentMonth), 4);

const streak = computeBestStreak(habits, completions);
assert.equal(streak.days, 3);
assert.equal(streak.habitName, 'Run');

assert.equal(computeMonthlyCompletionPercent(habits, completions, currentMonth), 6);

assert.equal(computeHabitCompletionPercent('h1', completions, currentMonth), 10);

const weekdayHabit = { id: 'h1', name: 'Run', activeDays: [1, 2, 3, 4, 5] };
const weekdayCompletions: Record<string, string[]> = {};
for (let day = 1; day <= 31; day++) {
  const key = `2026-07-${String(day).padStart(2, '0')}`;
  const weekday = new Date(2026, 6, day).getDay();
  if (weekday >= 1 && weekday <= 5) weekdayCompletions[key] = ['h1'];
}
assert.equal(
  computeHabitCompletionPercent('h1', weekdayCompletions, currentMonth, weekdayHabit.activeDays),
  100
);
assert.ok(
  computeHabitCompletionPercent('h1', weekdayCompletions, currentMonth) < 100,
  'full-week denominator should not be 100% for weekday-only completions'
);

const restDayCompletions = {
  ...weekdayCompletions,
  '2026-07-04': ['h1'],
  '2026-07-05': ['h1'],
};
assert.equal(
  computeHabitCompletionPercent('h1', restDayCompletions, currentMonth, weekdayHabit.activeDays),
  100
);

const mwfHabit = { id: 'h3', name: 'Lift', activeDays: [1, 3, 5] };
const mwfCompletions = {
  '2026-07-06': ['h3'],
  '2026-07-08': ['h3'],
};
const mwfStreak = computeBestStreak([mwfHabit], mwfCompletions);
assert.equal(mwfStreak.days, 2);

console.log('selectors smoke tests passed');
