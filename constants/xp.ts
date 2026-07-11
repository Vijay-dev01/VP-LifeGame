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
