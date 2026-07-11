const LEVEL_TITLES = [
  'Rookie',
  'Starter',
  'Explorer',
  'Grinder',
  'Focused',
  'Builder',
  'Architect',
  'Master',
  'Elite',
  'Legend',
] as const;

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpProgressInLevel(xp: number): {
  level: number;
  title: string;
  current: number;
  needed: number;
  percent: number;
} {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const current = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return {
    level,
    title: LEVEL_TITLES[titleIndex],
    current,
    needed,
    percent: needed > 0 ? Math.round((current / needed) * 100) : 100,
  };
}
