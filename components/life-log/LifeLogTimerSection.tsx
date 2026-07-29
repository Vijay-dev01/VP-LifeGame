import React from 'react';
import { ActiveTimerBar } from '@/components/life-log/ActiveTimerBar';
import { QuickAddBar } from '@/components/life-log/QuickAddBar';
import { TimeSummary } from '@/components/life-log/TimeSummary';
import { useTimer } from '@/hooks/useTimer';

interface LifeLogTimerSectionProps {
  todayLabel: string;
  todayTotalMinutes: number;
  onStopPress: () => void;
  onQuickStart: (categoryId: string) => void;
}

/** Isolates 1Hz timer tick so the rest of Life Log does not re-render every second. */
export function LifeLogTimerSection({
  todayLabel,
  todayTotalMinutes,
  onStopPress,
  onQuickStart,
}: LifeLogTimerSectionProps) {
  const { activeTimer, elapsedSeconds, isRunning, isPaused, togglePause } = useTimer();

  return (
    <>
      <TimeSummary
        todayLabel={todayLabel}
        todayTotalMinutes={todayTotalMinutes}
        isRunning={isRunning}
        elapsedSeconds={elapsedSeconds}
        activeTitle={activeTimer?.title}
      />
      {isRunning && activeTimer ? (
        <ActiveTimerBar
          categoryId={activeTimer.category}
          title={activeTimer.title}
          elapsedSeconds={elapsedSeconds}
          isPaused={isPaused}
          onStop={onStopPress}
          onTogglePause={togglePause}
        />
      ) : (
        <QuickAddBar onQuickStart={onQuickStart} disabled={isRunning} />
      )}
    </>
  );
}
