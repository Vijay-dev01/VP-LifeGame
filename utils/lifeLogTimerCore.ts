/** Timer shape used by elapsed/duration helpers (no store import — safe for node tests). */
export interface LifeLogTimerState {
  startTime: string;
  sessionStartTime?: string;
  pausedAt?: string | null;
  accumulatedSeconds?: number;
}

export function getTimerElapsedSeconds(
  timerOrStartTime: LifeLogTimerState | string
): number {
  if (typeof timerOrStartTime === 'string') {
    return Math.max(
      0,
      Math.floor((Date.now() - new Date(timerOrStartTime).getTime()) / 1000)
    );
  }
  const timer = timerOrStartTime;
  const accumulated = timer.accumulatedSeconds ?? 0;
  if (timer.pausedAt) {
    return accumulated;
  }
  const runningMs = Date.now() - new Date(timer.startTime).getTime();
  return Math.max(0, accumulated + Math.floor(runningMs / 1000));
}

export function isTimerPaused(timer: LifeLogTimerState): boolean {
  return !!timer.pausedAt;
}

export function getActiveDurationMinutes(timer: LifeLogTimerState): number {
  return Math.max(0, Math.round(getTimerElapsedSeconds(timer) / 60));
}

export function formatTimerElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
