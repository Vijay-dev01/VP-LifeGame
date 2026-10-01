import assert from 'node:assert/strict';
import type { Habit } from '../store';
import {
  addHabitToMonth,
  cloneHabits,
  copyHabitsToMonth,
  deleteHabitInMonth,
  habitsForMonth,
  monthKeyFromDate,
  seedHabitsByMonth,
  updateHabitInMonth,
} from '../utils/habitsByMonth';
import { computeBestStreak } from '../store/selectors';

const SEP = '2026-09-01';
const OCT = '2026-10-01';

function habit(id: string, name: string, order = 0): Habit {
  return {
    id,
    name,
    emoji: '🏃',
    order,
    activeDays: [1, 2, 3, 4, 5],
  };
}

assert.equal(monthKeyFromDate('2026-09-15'), SEP);
assert.equal(monthKeyFromDate('2026-10-01'), OCT);

let habitsByMonth: Record<string, Habit[]> = {
  [SEP]: [habit('h1', 'Exercise'), habit('h2', 'Reading'), habit('h3', 'Meditation')],
};
habitsByMonth = addHabitToMonth(habitsByMonth, OCT, habit('h4', 'Boxing', 0));

assert.equal(habitsForMonth(habitsByMonth, SEP).length, 3);
assert.equal(habitsForMonth(habitsByMonth, OCT).length, 1);
assert.equal(habitsForMonth(habitsByMonth, OCT)[0].name, 'Boxing');
assert.ok(habitsForMonth(habitsByMonth, SEP).every((h) => h.name !== 'Boxing'));

habitsByMonth = copyHabitsToMonth(habitsByMonth, SEP, OCT);
habitsByMonth = updateHabitInMonth(habitsByMonth, OCT, 'h1', { name: 'Gym' });
assert.equal(habitsForMonth(habitsByMonth, SEP).find((h) => h.id === 'h1')?.name, 'Exercise');
assert.equal(habitsForMonth(habitsByMonth, OCT).find((h) => h.id === 'h1')?.name, 'Gym');

const cloned = cloneHabits(habitsForMonth(habitsByMonth, SEP));
cloned[0].name = 'Mutated';
assert.equal(habitsForMonth(habitsByMonth, SEP)[0].name, 'Exercise');

let completions: Record<string, string[]> = {
  '2026-09-15': ['h1', 'h2'],
  '2026-10-02': ['h1'],
  '2026-10-03': ['h1', 'h3'],
};
const deleted = deleteHabitInMonth(habitsByMonth, completions, OCT, 'h1');
assert.ok(deleted.habitsByMonth[SEP].some((h) => h.id === 'h1'));
assert.ok(!deleted.habitsByMonth[OCT].some((h) => h.id === 'h1'));
assert.deepEqual(deleted.completions['2026-09-15'], ['h1', 'h2']);
assert.equal(deleted.completions['2026-10-02'], undefined);
assert.deepEqual(deleted.completions['2026-10-03'], ['h3']);

const seeded = seedHabitsByMonth(
  [habit('h1', 'Exercise')],
  { '2026-09-15': ['h1'], '2026-08-02': ['h1'] },
  OCT
);
assert.ok(seeded[SEP]);
assert.ok(seeded['2026-08-01']);
assert.ok(seeded[OCT]);
seeded[OCT][0].name = 'October only';
assert.equal(seeded[SEP][0].name, 'Exercise');

const streakHabits = [{ id: 'h1', name: 'Run' }];
const mixedCompletions = {
  '2026-09-14': ['h1'],
  '2026-09-15': ['h1'],
  '2026-10-01': ['h1'],
  '2026-10-02': ['h1'],
  '2026-10-03': ['h1'],
};
assert.equal(computeBestStreak(streakHabits, mixedCompletions, SEP).days, 2);
assert.equal(computeBestStreak(streakHabits, mixedCompletions, OCT).days, 3);

console.log('habitsByMonth tests passed');
