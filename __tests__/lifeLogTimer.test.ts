import type { LifeLogTimerState } from '../utils/lifeLogTimerCore';
import {
  getActiveDurationMinutes,
  getTimerElapsedSeconds,
} from '../utils/lifeLogTimerCore';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeTimer(
  partial: Partial<LifeLogTimerState> & Pick<LifeLogTimerState, 'startTime' | 'sessionStartTime'>
): LifeLogTimerState {
  return {
    pausedAt: null,
    accumulatedSeconds: 0,
    ...partial,
  };
}

// 10 min first segment + 15 min second segment = 25 min active (5 min pause excluded)
const pausedCycleTimer = makeTimer({
  accumulatedSeconds: 10 * 60,
  startTime: new Date(Date.now() - 15 * 60_000).toISOString(),
  sessionStartTime: new Date(Date.now() - 30 * 60_000).toISOString(),
});

assert(
  getTimerElapsedSeconds(pausedCycleTimer) === 25 * 60,
  'running elapsed should sum accumulated + current segment'
);
assert(
  getActiveDurationMinutes(pausedCycleTimer) === 25,
  'active duration should exclude paused gap'
);

const stoppedWhilePaused = makeTimer({
  accumulatedSeconds: 25 * 60,
  pausedAt: new Date().toISOString(),
  startTime: new Date(Date.now() - 15 * 60_000).toISOString(),
  sessionStartTime: new Date(Date.now() - 30 * 60_000).toISOString(),
});

assert(
  getTimerElapsedSeconds(stoppedWhilePaused) === 25 * 60,
  'paused timer should freeze at accumulated seconds'
);
assert(
  getActiveDurationMinutes(stoppedWhilePaused) === 25,
  'stop while paused should use accumulated active time'
);

const wallClockMinutes = Math.round(
  (Date.now() - new Date(stoppedWhilePaused.sessionStartTime!).getTime()) / 60_000
);
assert(
  wallClockMinutes >= 29,
  'sanity: wall clock includes pause (test setup)'
);
assert(
  getActiveDurationMinutes(stoppedWhilePaused) < wallClockMinutes,
  'active duration must be less than wall-clock when paused time exists'
);

console.log('lifeLogTimer tests passed');
