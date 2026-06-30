import { getCategoryById } from '@/constants/lifeLogCategories';
import type { ReportData } from '../reportData';
import { formatDurationHours } from '../reportData';
import { esc, sectionHeader, statCard } from '../reportTheme';

export function renderLifeAnalyticsSection(data: ReportData): string {
  const m = data.lifeMetrics;

  const categoryBars = m.categoryBreakdown
    .slice(0, 8)
    .map((item) => {
      const cat = getCategoryById(item.categoryId);
      const color = cat?.color ?? '#dc2626';
      return `
      <div class="bar-row">
        <div class="bar-label">${esc(cat?.label ?? item.categoryId)}</div>
        <div class="bar-track"><span class="bar-fill" style="width:${item.percent}%;background:${color}"></span></div>
        <div class="bar-val">${item.percent}%</div>
      </div>`;
    })
    .join('');

  const weeklyBars = data.weeklyHours
    .map((w) => {
      const maxMin = Math.max(...data.weeklyHours.map((x) => x.minutes), 1);
      const pct = Math.round((w.minutes / maxMin) * 100);
      return `
      <div class="bar-row">
        <div class="bar-label">${esc(w.label)}</div>
        <div class="bar-track"><span class="bar-fill" style="width:${pct}%;background:#dc2626"></span></div>
        <div class="bar-val">${esc(formatDurationHours(w.minutes))}</div>
      </div>`;
    })
    .join('');

  const insights = data.lifeInsights
    .map((msg) => `<div class="insight-item">${esc(msg)}</div>`)
    .join('');

  const topCat = m.mostUsedCategory
    ? getCategoryById(m.mostUsedCategory)?.label ?? m.mostUsedCategory
    : '—';

  return `
    <div class="section section-break">
      ${sectionHeader('04', 'Life Analytics')}
      <p class="section-desc">Productivity scores, trends, and behavioral insights</p>

      <div class="grid grid-5">
        ${statCard('Focus score', `${m.focusScore}%`, true)}
        ${statCard('Distraction', `${m.distractionScore}%`)}
        ${statCard('Intentionality', `${m.intentionalityScore}%`)}
        ${statCard('Recovery', `${m.recoveryScore}%`)}
        ${statCard('Consistency', `${m.consistencyScore}%`)}
      </div>

      <div class="grid" style="margin-top:12px">
        ${statCard('Week hours', formatDurationHours(m.weekTotalMinutes))}
        ${statCard('Month hours', formatDurationHours(m.monthTotalMinutes), true)}
        ${statCard('Top category', topCat)}
      </div>

      <div class="grid grid-2" style="margin-top:12px">
        ${statCard('Avg deep work/day', formatDurationHours(m.avgDeepWorkMinutesPerDay))}
        ${statCard('Avg distraction/day', formatDurationHours(m.avgDistractionMinutesPerDay))}
        ${statCard('Sleep / recovery avg', formatDurationHours(m.avgSleepMinutes))}
        ${statCard('Daily activities', String(m.avgDailyActivityCount))}
      </div>

      <div class="chart-box">
        <div class="chart-title">Category breakdown</div>
        ${categoryBars || '<div class="empty">No category data.</div>'}
      </div>

      <div class="chart-box">
        <div class="chart-title">Weekly hours logged</div>
        ${weeklyBars || '<div class="empty">No weekly data.</div>'}
      </div>

      <div class="sub-heading">Insights</div>
      <div class="insights">
        ${insights || '<div class="empty">No insights for this period.</div>'}
      </div>
    </div>`;
}
