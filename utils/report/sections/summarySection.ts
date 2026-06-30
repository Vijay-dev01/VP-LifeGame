import type { ReportData } from '../reportData';
import { esc, sectionHeader, statCard } from '../reportTheme';

export function renderSummarySection(data: ReportData): string {
  const loggedHours = data.totalLoggedMinutes / 60;
  const loggedLabel =
    loggedHours % 1 === 0 ? `${loggedHours}h` : `${loggedHours.toFixed(1)}h`;

  return `
    <div class="section">
      ${sectionHeader('00', 'Executive Summary')}
      <p class="section-desc">Overview of habits, missions, and life tracking for ${esc(data.monthLabel)}</p>
      <div class="grid" style="grid-template-columns: repeat(5, 1fr);">
        ${statCard('Habits', String(data.totalHabits))}
        ${statCard('Completions', String(data.totalHabitCompletions))}
        ${statCard('Global Progress', `${data.monthlyHabitPct}%`, true)}
        ${statCard('Logged Hours', loggedLabel)}
        ${statCard('Log Consistency', `${data.lifeConsistencyScore}%`)}
      </div>
    </div>`;
}
