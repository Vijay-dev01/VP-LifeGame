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

console.log('selectors smoke tests passed');
