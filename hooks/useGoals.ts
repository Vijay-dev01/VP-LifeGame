import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/store';
import type { LifeGoal } from '@/store/goalTypes';
import { computeGoalHealth } from '@/utils/goalHealth';
import { formatPaceHint, getPaceStatus } from '@/utils/goalPace';
import { getWeekStart } from '@/utils/goalDecomposition';

function buildGoalMeta(
  goal: LifeGoal,
  goalProgressEntries: ReturnType<typeof useStore.getState>['goalProgressEntries'],
  goalWeeklyTargets: ReturnType<typeof useStore.getState>['goalWeeklyTargets'],
  goalDailyActions: ReturnType<typeof useStore.getState>['goalDailyActions'],
  goalHealthSnapshots: ReturnType<typeof useStore.getState>['goalHealthSnapshots'],
  today: string,
  weekStart: string
) {
  const weeklyTarget = goalWeeklyTargets.find(
    (w) => w.goalId === goal.id && w.weekStart === weekStart
  );
  const health =
    goalHealthSnapshots.find((h) => h.goalId === goal.id && h.date === today) ??
    computeGoalHealth(
      goal,
      goalProgressEntries,
      today,
      weeklyTarget?.targetValue ?? 0,
      weeklyTarget?.actualValue ?? 0
    );
  const paceStatus = getPaceStatus(goal, today);
  const paceHint = formatPaceHint(goal, today, health.currentDailyRate);
  const todayActions = goalDailyActions.filter(
    (a) => a.goalId === goal.id && a.date === today
  );
  const weekActions = goalDailyActions.filter(
    (a) => a.goalId === goal.id && a.date >= weekStart
  );
  const weekActual = goalProgressEntries
    .filter((e) => e.goalId === goal.id && e.date >= weekStart && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    goal,
    health,
    paceStatus,
    paceHint,
    weeklyTarget,
    weekActual,
    todayActions,
    weekActions,
    progressPercent:
      goal.targetValue > 0
        ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
        : 0,
  };
}

export function useGoals() {
  const lifeGoals = useStore((s) => s.lifeGoals);
  const goalProgressEntries = useStore((s) => s.goalProgressEntries);
  const goalWeeklyTargets = useStore((s) => s.goalWeeklyTargets);
  const goalDailyActions = useStore((s) => s.goalDailyActions);
  const goalHealthSnapshots = useStore((s) => s.goalHealthSnapshots);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = getWeekStart(new Date());

  const activeGoals = useMemo(
    () =>
      lifeGoals
        .filter((g) => g.status === 'active')
        .sort((a, b) => a.order - b.order),
    [lifeGoals]
  );

  const goalsWithMeta = useMemo(() => {
    return activeGoals.map((goal) =>
      buildGoalMeta(
        goal,
        goalProgressEntries,
        goalWeeklyTargets,
        goalDailyActions,
        goalHealthSnapshots,
        today,
        weekStart
      )
    );
  }, [
    activeGoals,
    goalDailyActions,
    goalProgressEntries,
    goalWeeklyTargets,
    goalHealthSnapshots,
    today,
    weekStart,
  ]);

  const atRiskGoals = useMemo(
    () =>
      goalsWithMeta
        .filter((g) => g.paceStatus === 'at_risk' || g.paceStatus === 'behind')
        .sort((a, b) => a.health.score - b.health.score),
    [goalsWithMeta]
  );

  const topFocusGoal = atRiskGoals[0] ?? goalsWithMeta[0] ?? null;

  return {
    activeGoals,
    goalsWithMeta,
    atRiskGoals,
    topFocusGoal,
    today,
    weekStart,
    allGoals: lifeGoals,
  };
}

export function useGoalDetail(goalId: string) {
  const goal = useStore((s) => s.lifeGoals.find((g) => g.id === goalId));
  const goalProgressEntries = useStore((s) => s.goalProgressEntries);
  const goalProgressRules = useStore((s) => s.goalProgressRules);
  const goalDailyActions = useStore((s) => s.goalDailyActions);
  const goalWeeklyTargets = useStore((s) => s.goalWeeklyTargets);
  const goalHealthSnapshots = useStore((s) => s.goalHealthSnapshots);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = getWeekStart(new Date());

  const entries = useMemo(
    () =>
      goalProgressEntries
        .filter((e) => e.goalId === goalId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [goalProgressEntries, goalId]
  );

  const rules = useMemo(
    () => goalProgressRules.filter((r) => r.goalId === goalId),
    [goalProgressRules, goalId]
  );

  const dailyActions = useMemo(
    () => goalDailyActions.filter((a) => a.goalId === goalId),
    [goalDailyActions, goalId]
  );

  const meta = useMemo(() => {
    if (!goal) return undefined;
    return buildGoalMeta(
      goal,
      goalProgressEntries,
      goalWeeklyTargets,
      goalDailyActions,
      goalHealthSnapshots,
      today,
      weekStart
    );
  }, [
    goal,
    goalProgressEntries,
    goalWeeklyTargets,
    goalDailyActions,
    goalHealthSnapshots,
    today,
    weekStart,
  ]);

  return {
    goal,
    entries,
    rules,
    dailyActions,
    meta,
    health: meta?.health ?? null,
  };
}

export function sortGoalsByPriority(goals: LifeGoal[]): LifeGoal[] {
  return [...goals].sort((a, b) => a.order - b.order);
}
