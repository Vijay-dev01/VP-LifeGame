export type GoalMetricType = 'count' | 'duration_minutes';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalCategory =
  | 'career'
  | 'health'
  | 'learning'
  | 'finance'
  | 'social'
  | 'creative'
  | 'personal';
export type GoalPaceStatus = 'ahead' | 'on_track' | 'behind' | 'at_risk' | 'completed';
export type GoalProgressSource = 'mission' | 'life_log' | 'habit' | 'manual';
export type GoalProgressMatchType = 'keyword' | 'category' | 'habit_id' | 'exact_title';

export interface LifeGoal {
  id: string;
  title: string;
  emoji: string;
  category: GoalCategory;
  metricType: GoalMetricType;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  deadlineDate: string | null;
  status: GoalStatus;
  motivationNote?: string;
  linkedHabitIds: string[];
  createdAt: string;
  completedAt?: string;
  order: number;
  lastMilestoneAwarded?: number;
}

export interface GoalWeeklyTarget {
  id: string;
  goalId: string;
  weekStart: string;
  targetValue: number;
  actualValue: number;
}

export interface GoalDailyAction {
  id: string;
  goalId: string;
  weeklyTargetId: string;
  date: string;
  title: string;
  targetValue: number;
  actualValue: number;
  missionTaskId?: string;
  done: boolean;
}

export interface GoalProgressRule {
  id: string;
  goalId: string;
  source: GoalProgressSource;
  matchType: GoalProgressMatchType;
  matchValue: string;
  incrementValue: number;
  enabled: boolean;
}

export interface GoalProgressEntry {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  source: GoalProgressSource;
  sourceId?: string;
  note?: string;
  createdAt: string;
}

export interface GoalHealthSnapshot {
  goalId: string;
  date: string;
  score: number;
  paceStatus: GoalPaceStatus;
  daysRemaining: number | null;
  requiredDailyRate: number;
  currentDailyRate: number;
}

export interface CreateGoalInput {
  title: string;
  emoji: string;
  category: GoalCategory;
  metricType: GoalMetricType;
  targetValue: number;
  unit: string;
  deadlineDate: string | null;
  motivationNote?: string;
  progressRules: Omit<GoalProgressRule, 'id' | 'goalId'>[];
}
