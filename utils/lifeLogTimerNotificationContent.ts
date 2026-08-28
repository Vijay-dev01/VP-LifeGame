import type { ActiveTimer } from '@/store';
import { theme } from '@/constants/theme';
import {
  formatTimerElapsed,
  getTimerElapsedSeconds,
  isTimerPaused,
} from '@/utils/lifeLog';

export const TIMER_NOTIFICATION_ID = 'lifelog-active-timer';
export const TIMER_CHANNEL_ID = 'life-log-timer';
export const TIMER_CATEGORY_ID = 'lifelog-timer-actions';
export const TIMER_SOURCE = 'lifelog-timer';
export const TIMER_ACTION_STOP = 'timer-stop';
export const TIMER_ACTION_PAUSE = 'timer-pause';

function capitalizeTitle(title: string): string {
  if (!title) return 'Activity';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export interface LifeLogTimerNotificationContent {
  title: string;
  body: string;
  pauseActionLabel: string;
  elapsedSeconds: number;
  isPaused: boolean;
}

export function buildLifeLogTimerNotificationContent(
  timer: ActiveTimer
): LifeLogTimerNotificationContent {
  const elapsedSeconds = getTimerElapsedSeconds(timer);
  const isPaused = isTimerPaused(timer);
  const elapsed = formatTimerElapsed(elapsedSeconds);
  const stateLabel = isPaused ? 'Paused' : 'Running';

  return {
    title: `🟢 ${capitalizeTitle(timer.title)}`,
    body: `⏱ ${elapsed} · ${isPaused ? '⏸' : '▶️'} ${stateLabel}`,
    pauseActionLabel: isPaused ? 'RESUME' : 'PAUSE',
    elapsedSeconds,
    isPaused,
  };
}

export const TIMER_NOTIFICATION_COLOR = theme.accent;
