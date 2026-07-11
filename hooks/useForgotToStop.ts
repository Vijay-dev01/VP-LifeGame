import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { useStore } from '@/store';
import { getTimerElapsedSeconds } from '@/utils/lifeLog';

export function useForgotToStop() {
  const activeTimer = useStore((s) => s.activeTimer);
  const forgotToStopState = useStore((s) => s.forgotToStopState);
  const markForgotToStopPrompted = useStore((s) => s.markForgotToStopPrompted);
  const [showModal, setShowModal] = useState(false);

  const checkShouldPrompt = useCallback(() => {
    if (!activeTimer) return false;

    const today = format(new Date(), 'yyyy-MM-dd');
    if (forgotToStopState.lastPromptDate === today) return false;

    const elapsedHours = getTimerElapsedSeconds(activeTimer) / 3600;
    const threshold = forgotToStopState.thresholdHours;

    const sessionStart = parseISO(activeTimer.sessionStartTime ?? activeTimer.startTime);
    const crossedMidnight = isBefore(startOfDay(new Date()), startOfDay(sessionStart));

    return elapsedHours >= threshold || crossedMidnight;
  }, [activeTimer, forgotToStopState]);

  useEffect(() => {
    const runCheck = () => {
      if (checkShouldPrompt()) setShowModal(true);
    };

    runCheck();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runCheck();
    });
    return () => sub.remove();
  }, [checkShouldPrompt]);

  const dismiss = useCallback(() => {
    markForgotToStopPrompted(format(new Date(), 'yyyy-MM-dd'));
    setShowModal(false);
  }, [markForgotToStopPrompted]);

  return { showModal, dismiss, setShowModal };
}
