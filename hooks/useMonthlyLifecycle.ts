import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useStore } from '@/store';
import { emailMonthlyPdf } from '@/utils/monthlyReport';

function hasAnyData() {
  const s = useStore.getState();
  return (
    s.habits.length > 0 ||
    Object.keys(s.completions).length > 0 ||
    Object.keys(s.dayTasks).length > 0
  );
}

async function runMonthlyBoundaryFlow() {
  const s = useStore.getState();
  const nowMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  if (s.lastProcessedMonth === nowMonth) return;

  const prevMonth = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

  if (hasAnyData() && s.autoEmailMonthlyReport) {
    try {
      // NOTE: Mobile platforms generally require user interaction to actually send.
      await emailMonthlyPdf(prevMonth, s.reportRecipient);
    } catch {
      // Continue reset flow even if compose failed.
    }
  }

  Alert.alert(
    'New month started',
    'Do you want to reset previous tracking data for a fresh month?',
    [
      {
        text: 'Keep Data',
        style: 'cancel',
        onPress: () => useStore.getState().markMonthProcessed(nowMonth),
      },
      {
        text: 'Reset Data',
        style: 'destructive',
        onPress: () => {
          const st = useStore.getState();
          st.resetAllData();
          st.markMonthProcessed(nowMonth);
        },
      },
    ]
  );
}

export function useMonthlyLifecycle() {
  useEffect(() => {
    runMonthlyBoundaryFlow();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runMonthlyBoundaryFlow();
    });
    return () => sub.remove();
  }, []);
}
