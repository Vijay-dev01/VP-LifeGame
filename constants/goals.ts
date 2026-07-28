import type { GoalCategory, GoalMetricType } from '@/store/goalTypes';

export const GOAL_CATEGORIES: { id: GoalCategory; label: string; emoji: string }[] = [
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'health', label: 'Health', emoji: '💪' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'personal', label: 'Personal', emoji: '⭐' },
];

export const GOAL_METRIC_TYPES: { id: GoalMetricType; label: string; defaultUnit: string }[] = [
  { id: 'count', label: 'Count', defaultUnit: 'times' },
  { id: 'duration_minutes', label: 'Duration', defaultUnit: 'minutes' },
];

export const GOAL_EXAMPLES = [
  'Apply to 500 companies',
  'Complete 1000 pushups',
  'Read 24 books',
  'Talk to 10 strangers',
];

export const CATEGORY_EMOJI: Record<GoalCategory, string> = {
  career: '💼',
  health: '💪',
  learning: '📚',
  finance: '💰',
  social: '🤝',
  creative: '🎨',
  personal: '⭐',
};

export const PACE_LABELS = {
  ahead: { emoji: '🟢', label: 'Ahead of pace' },
  on_track: { emoji: '🟢', label: 'On pace' },
  behind: { emoji: '🟡', label: 'Slightly behind' },
  at_risk: { emoji: '🔴', label: 'At risk' },
  completed: { emoji: '🏆', label: 'Completed' },
} as const;
