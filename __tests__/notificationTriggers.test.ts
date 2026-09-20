import assert from 'node:assert/strict';
import {
  localDateTime,
  nextHabitReminderDates,
  planItemTriggerDate,
  upcomingPlanItemTriggers,
} from '../utils/notificationTriggers';

const evening = new Date(2026, 8, 18, 22, 0, 0, 0);

const tomorrowMorning = localDateTime('2026-09-19', '09:00');
assert.ok(tomorrowMorning);
assert.equal(tomorrowMorning.getFullYear(), 2026);
assert.equal(tomorrowMorning.getMonth(), 8);
assert.equal(tomorrowMorning.getDate(), 19);
assert.equal(tomorrowMorning.getHours(), 9);
assert.equal(tomorrowMorning.getMinutes(), 0);

const utcParsed = new Date('2026-09-19');
assert.notEqual(tomorrowMorning.getTime(), utcParsed.getTime());

const weekdayDays = [1, 2, 3, 4, 5];
const fridayNight = new Date(2026, 8, 18, 22, 0, 0, 0);
const upcoming = nextHabitReminderDates(weekdayDays, '08:30', fridayNight, 7);
assert.ok(upcoming.length >= 4);
assert.equal(upcoming[0].date, '2026-09-21');
assert.equal(upcoming[0].trigger.getHours(), 8);
assert.equal(upcoming[0].trigger.getMinutes(), 30);
assert.ok(upcoming.every((item) => item.trigger > fridayNight));
assert.ok(!upcoming.some((item) => item.date === '2026-09-19' || item.date === '2026-09-20'));

const past = planItemTriggerDate('2026-09-18', '09:00', evening);
assert.equal(past, null);

const future = planItemTriggerDate('2026-09-19', '09:00', evening);
assert.ok(future);
assert.equal(future.getDate(), 19);
assert.equal(future.getHours(), 9);

const items = upcomingPlanItemTriggers(
  [
    { id: 'a', date: '2026-09-19', time: '08:00', title: 'Run' },
    { id: 'b', date: '2026-09-19', time: '12:00', title: 'Lunch' },
    { id: 'c', date: '2026-09-19', time: '18:00', title: 'Gym' },
    { id: 'd', date: '2026-09-18', time: '21:00', title: 'Past' },
  ],
  evening
);
assert.equal(items.length, 3);
assert.deepEqual(
  items.map((i) => i.id),
  ['a', 'b', 'c']
);
assert.ok(items[0].trigger.getTime() < items[1].trigger.getTime());
assert.ok(items[1].trigger.getTime() < items[2].trigger.getTime());
assert.equal(items[0].trigger.getDate(), 19);

console.log('notification trigger tests passed');
