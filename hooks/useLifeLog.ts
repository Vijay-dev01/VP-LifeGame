import { useCallback, useMemo, useState } from 'react';
import {
  endOfMonth,
  format,
  isThisWeek,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { useStore, type LifeLog, type LifeLogIntent, type LifeLogMood } from '@/store';
import {
  filterLogsInRange,
  getLogDateKey,
  parseActivityKey,
  sortLogsByStartDesc,
  sumDuration,
} from '@/utils/lifeLog';
import { resolveCategory } from '@/constants/lifeLogCategories';

export interface LifeLogFilters {
  category: string | null;
  mood: LifeLogMood | null;
  intentType: LifeLogIntent | null;
  searchQuery: string;
}

export interface DayLogGroup {
  dateKey: string;
  title: string;
  logs: LifeLog[];
}

export interface GroupedLifeLogs {
  today: LifeLog[];
  yesterday: LifeLog[];
  thisWeek: LifeLog[];
  older: LifeLog[];
  byDay: DayLogGroup[];
  useCalendarDays: boolean;
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
        (resolveCategory(l.category, useStore.getState().customLifeLogCategories)?.label
          .toLowerCase()
          .includes(q) ?? false)
    );
  }
  return result;
}

function emptyRelativeGroups(): Pick<GroupedLifeLogs, 'today' | 'yesterday' | 'thisWeek' | 'older'> {
  return { today: [], yesterday: [], thisWeek: [], older: [] };
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
    byDay: [],
    useCalendarDays: false,
  };
}

function groupLogsByDay(logs: LifeLog[]): GroupedLifeLogs {
  const map = new Map<string, LifeLog[]>();
  for (const log of logs) {
    const key = getLogDateKey(log);
    const list = map.get(key) ?? [];
    list.push(log);
    map.set(key, list);
  }
  const byDay: DayLogGroup[] = [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, dayLogs]) => ({
      dateKey,
      title: format(parseISO(dateKey + 'T12:00:00'), 'EEEE, MMM d').toUpperCase(),
      logs: sortLogsByStartDesc(dayLogs),
    }));

  return {
    ...emptyRelativeGroups(),
    byDay,
    useCalendarDays: true,
  };
}

export function useLifeLog() {
  const logs = useStore((s) => s.lifeLogs);
  const currentMonth = useStore((s) => s.currentMonth);
  const recentActivityKeys = useStore((s) => s.recentActivityKeys);
  const dayPlans = useStore((s) => s.dayPlans);
  const customNextItems = useStore((s) => s.customNextItems);
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
  const monthLogs = useMemo(() => {
    const start = startOfMonth(new Date(currentMonth + 'T12:00:00'));
    return filterLogsInRange(logs, start, endOfMonth(start));
  }, [logs, currentMonth]);
  const sortedMonthLogs = useMemo(() => sortLogsByStartDesc(monthLogs), [monthLogs]);
  const filteredLogs = useMemo(
    () => applyFilters(sortedMonthLogs, filters),
    [sortedMonthLogs, filters]
  );
  const viewingCurrentMonth = currentMonth === format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const groupedLogs = useMemo(
    () => (viewingCurrentMonth ? groupLogs(filteredLogs) : groupLogsByDay(filteredLogs)),
    [filteredLogs, viewingCurrentMonth]
  );

  const todayTotalMinutes = useMemo(() => {
    const todayLogs = logs.filter((l) => isToday(parseISO(l.startTime)));
    return sumDuration(todayLogs);
  }, [logs]);

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
        title:
          resolveCategory(cat, useStore.getState().customLifeLogCategories)?.examples[0] ?? cat,
      })),
      suggestionsFromPlan: false,
    };
  }, [sortedLogs, dayPlans, today]);

  const mergedSuggestedNext = useMemo(() => {
    const customs = customNextItems.map((item) => ({
      category: item.category,
      title: item.title,
    }));
    const seen = new Set(customs.map((c) => c.title.trim().toLowerCase()));
    const rest = suggestedNext.filter((s) => !seen.has(s.title.trim().toLowerCase()));
    return [...customs, ...rest];
  }, [customNextItems, suggestedNext]);

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
    logs: sortedMonthLogs,
    filteredLogs,
    groupedLogs,
    todayTotalMinutes,
    dayTotals,
    recentActivities,
    suggestedNext: mergedSuggestedNext,
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
