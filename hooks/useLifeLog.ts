import { useCallback, useMemo, useState } from 'react';
import {
  format,
  isThisWeek,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';
import { useStore, type LifeLog, type LifeLogIntent, type LifeLogMood } from '@/store';
import { parseActivityKey, sortLogsByStartDesc, sumDuration } from '@/utils/lifeLog';
import { getCategoryById } from '@/constants/lifeLogCategories';

export interface LifeLogFilters {
  category: string | null;
  mood: LifeLogMood | null;
  intentType: LifeLogIntent | null;
  searchQuery: string;
}

export interface GroupedLifeLogs {
  today: LifeLog[];
  yesterday: LifeLog[];
  thisWeek: LifeLog[];
  older: LifeLog[];
}

const SUGGESTION_RULES: Record<string, string[]> = {
  health: ['shallow-work', 'learning', 'deep-work'],
  recovery: ['health', 'shallow-work', 'deep-work'],
  'deep-work': ['health', 'learning', 'recovery'],
  learning: ['deep-work', 'health', 'shallow-work'],
  distraction: ['deep-work', 'health', 'recovery'],
  'shallow-work': ['deep-work', 'health', 'learning'],
};

function applyFilters(logs: LifeLog[], filters: LifeLogFilters): LifeLog[] {
  let result = logs;
  if (filters.category) {
    result = result.filter((l) => l.category === filters.category);
  }
  if (filters.mood) {
    result = result.filter((l) => l.mood === filters.mood);
  }
  if (filters.intentType) {
    result = result.filter((l) => l.intentType === filters.intentType);
  }
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.notes?.toLowerCase().includes(q) ?? false) ||
        (getCategoryById(l.category)?.label.toLowerCase().includes(q) ?? false)
    );
  }
  return result;
}

function groupLogs(logs: LifeLog[]): GroupedLifeLogs {
  const today: LifeLog[] = [];
  const yesterday: LifeLog[] = [];
  const thisWeek: LifeLog[] = [];
  const older: LifeLog[] = [];

  for (const log of logs) {
    const d = parseISO(log.startTime);
    if (isToday(d)) today.push(log);
    else if (isYesterday(d)) yesterday.push(log);
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(log);
    else older.push(log);
  }

  return {
    today: sortLogsByStartDesc(today),
    yesterday: sortLogsByStartDesc(yesterday),
    thisWeek: sortLogsByStartDesc(thisWeek),
    older: sortLogsByStartDesc(older),
  };
}

export function useLifeLog() {
  const logs = useStore((s) => s.lifeLogs);
  const recentActivityKeys = useStore((s) => s.recentActivityKeys);
  const dayPlans = useStore((s) => s.dayPlans);
  const addLifeLog = useStore((s) => s.addLifeLog);
  const updateLifeLog = useStore((s) => s.updateLifeLog);
  const deleteLifeLog = useStore((s) => s.deleteLifeLog);
  const duplicateLifeLog = useStore((s) => s.duplicateLifeLog);

  const [filters, setFilters] = useState<LifeLogFilters>({
    category: null,
    mood: null,
    intentType: null,
    searchQuery: '',
  });

  const sortedLogs = useMemo(() => sortLogsByStartDesc(logs), [logs]);
  const filteredLogs = useMemo(
    () => applyFilters(sortedLogs, filters),
    [sortedLogs, filters]
  );
  const groupedLogs = useMemo(() => groupLogs(filteredLogs), [filteredLogs]);

  const todayTotalMinutes = useMemo(
    () => sumDuration(groupedLogs.today),
    [groupedLogs.today]
  );

  const dayTotals = useCallback(
    (dayLogs: LifeLog[]) => sumDuration(dayLogs),
    []
  );

  const recentActivities = useMemo(
    () => recentActivityKeys.map((key) => parseActivityKey(key)),
    [recentActivityKeys]
  );

  const today = format(new Date(), 'yyyy-MM-dd');

  const { suggestedNext, suggestionsFromPlan } = useMemo(() => {
    const todayPlans = (dayPlans[today] ?? []).filter((p) => !p.done);
    if (todayPlans.length) {
      return {
        suggestedNext: todayPlans.slice(0, 3).map((p) => ({
          category: p.category,
          title: p.title,
        })),
        suggestionsFromPlan: true,
      };
    }

    const lastLog = sortedLogs[0];
    if (!lastLog) {
      return {
        suggestedNext: [
          { category: 'deep-work', title: 'coding' },
          { category: 'health', title: 'walking' },
        ],
        suggestionsFromPlan: false,
      };
    }
    const ruleCats = SUGGESTION_RULES[lastLog.category] ?? ['deep-work', 'health'];
    const fromHistory = sortedLogs
      .filter((l) => ruleCats.includes(l.category) && l.id !== lastLog.id)
      .slice(0, 3)
      .map((l) => ({ category: l.category, title: l.title }));

    if (fromHistory.length >= 2) {
      return { suggestedNext: fromHistory.slice(0, 3), suggestionsFromPlan: false };
    }

    return {
      suggestedNext: ruleCats.slice(0, 3).map((cat) => ({
        category: cat,
        title: getCategoryById(cat)?.examples[0] ?? cat,
      })),
      suggestionsFromPlan: false,
    };
  }, [sortedLogs, dayPlans, today]);

  const updateFilter = useCallback(
    <K extends keyof LifeLogFilters>(key: K, value: LifeLogFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({ category: null, mood: null, intentType: null, searchQuery: '' });
  }, []);

  const getLogById = useCallback(
    (id: string) => logs.find((l) => l.id === id),
    [logs]
  );

  const todayLabel = format(new Date(), 'EEEE, MMM d');

  return {
    logs: sortedLogs,
    filteredLogs,
    groupedLogs,
    todayTotalMinutes,
    dayTotals,
    recentActivities,
    suggestedNext,
    suggestionsFromPlan,
    filters,
    updateFilter,
    clearFilters,
    addLog: addLifeLog,
    updateLog: updateLifeLog,
    deleteLog: deleteLifeLog,
    duplicateLog: duplicateLifeLog,
    getLogById,
    todayLabel,
  };
}
