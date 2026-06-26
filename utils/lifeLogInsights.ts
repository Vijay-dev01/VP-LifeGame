import type { LifeLog } from '@/store';
import {
  computeLifeAnalytics,
  getLastWeekLearningMinutes,
  getLearningMinutesForWeek,
  getTodayLogs,
} from './lifeLogAnalytics';
import { sumDuration, sumDurationByCategory } from './lifeLog';

export function generateLifeInsights(logs: LifeLog[], now = new Date()): string[] {
  const insights: string[] = [];
  const metrics = computeLifeAnalytics(logs, now);
  const todayLogs = getTodayLogs(logs, now);

  const todayDistraction = sumDurationByCategory(todayLogs, 'distraction');
  const weekDistraction = sumDurationByCategory(
    logs.filter((l) => {
      const d = new Date(l.startTime);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo && d <= now;
    }),
    'distraction'
  );

  if (todayDistraction > 180 || weekDistraction > 180 * 3) {
    insights.push('High distraction detected.');
  }

  const todayDeepWork = sumDurationByCategory(todayLogs, 'deep-work');
  if (todayDeepWork > 240) {
    insights.push('Strong focus day.');
  }

  const todayRecovery = sumDurationByCategory(todayLogs, 'recovery');
  if (todayRecovery > 0 && todayRecovery < 360) {
    insights.push('Recovery deficit.');
  }

  const plannedToday = todayLogs.filter((l) => l.intentType === 'planned').length;
  const unplannedToday = todayLogs.filter((l) => l.intentType === 'unplanned').length;
  if (plannedToday > unplannedToday && todayLogs.length > 0) {
    insights.push('High intentionality.');
  }

  const learningThisWeek = getLearningMinutesForWeek(logs, now);
  const learningLastWeek = getLastWeekLearningMinutes(logs);
  if (learningThisWeek > learningLastWeek && learningLastWeek > 0) {
    insights.push('Growth improving.');
  }

  if (metrics.focusScore >= 50 && !insights.includes('Strong focus day.')) {
    insights.push('Solid focus this week.');
  }

  if (metrics.consistencyScore < 30 && logs.length > 0) {
    insights.push('Log more days to improve consistency.');
  }

  return insights.slice(0, 5);
}
