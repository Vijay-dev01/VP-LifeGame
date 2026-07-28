const XP_BY_CATEGORY: Record<string, number> = {
  'deep-work': 50,
  learning: 25,
  health: 40,
  'shallow-work': 20,
  recovery: 15,
  entertainment: 10,
  distraction: 5,
  relationships: 20,
  maintenance: 15,
  finance: 20,
};

const XP_BY_TITLE_KEYWORD: Record<string, number> = {
  coding: 50,
  reading: 25,
  gym: 40,
  workout: 40,
  walking: 30,
  meeting: 20,
  meditation: 30,
};

export function calcActivityXp(category: string, title: string): number {
  const lower = title.toLowerCase();
  for (const [keyword, xp] of Object.entries(XP_BY_TITLE_KEYWORD)) {
    if (lower.includes(keyword)) return xp;
  }
  return XP_BY_CATEGORY[category] ?? 15;
}

export const HABIT_XP_BONUS = 10;

export const GOAL_XP = {
  DAILY_ACTION_COMPLETE: 15,
  WEEKLY_TARGET_HIT: 75,
  MANUAL_PROGRESS: 5,
  MILESTONE_25: 50,
  MILESTONE_50: 100,
  MILESTONE_75: 150,
  GOAL_COMPLETE: 500,
} as const;
