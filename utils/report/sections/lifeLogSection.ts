import { format, parseISO } from 'date-fns';
import { renderDonutChart } from '../charts';
import type { ReportData } from '../reportData';
import { formatDuration, formatDurationHours } from '../reportData';
import { esc, sectionHeader } from '../reportTheme';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { MOOD_EMOJI } from '@/utils/lifeLog';

export function renderLifeLogSection(data: ReportData): string {
  const dailyRows = data.dailySummaries
    .map(
      (d) => `
      <tr>
        <td>${esc(d.label)}</td>
        <td class="num">${d.activityCount}</td>
        <td class="num">${esc(formatDurationHours(d.totalMinutes))}</td>
        <td>${esc(d.topCategory)}</td>
      </tr>`
    )
    .join('');

  const activityRows = data.activityLogs
    .map((log) => {
      const cat = getCategoryById(log.category)?.label ?? log.category;
      const time = format(parseISO(log.startTime), 'MMM d, h:mm a');
      const mood = log.mood ? MOOD_EMOJI[log.mood] : '—';
      return `
      <tr>
        <td>${esc(time)}</td>
        <td>${esc(log.title)}</td>
        <td>${esc(cat)}</td>
        <td class="num">${esc(formatDuration(log.duration))}</td>
        <td>${mood}</td>
        <td class="num">${log.energyLevel ?? '—'}</td>
        <td>${esc(log.intentType)}</td>
      </tr>`;
    })
    .join('');

  const focusRows = data.focusSessions
    .slice(0, 30)
    .map(
      (log) => `
      <tr>
        <td>${esc(format(parseISO(log.startTime), 'dd MMM'))}</td>
        <td>${esc(log.title)}</td>
        <td>${esc(getCategoryById(log.category)?.label ?? log.category)}</td>
        <td class="num">${esc(formatDuration(log.duration))}</td>
      </tr>`
    )
    .join('');

  const moodDonut =
    data.moodCounts.length > 0
      ? renderDonutChart(
          data.moodCounts.map((m) => ({
            label: m.mood,
            value: m.count,
            color: m.color,
          }))
        )
      : '<div class="empty">No mood data logged.</div>';

  const truncateNote = data.activityLogsTruncated
    ? `<p class="footnote">Showing ${data.activityLogs.length} of ${data.activityLogsTotal} activities.</p>`
    : '';

  return `
    <div class="section section-break">
      ${sectionHeader('03', 'Life Log Data')}
      <p class="section-desc">Daily activity logs, focus sessions, and mood tracking</p>

      <div class="sub-heading">Daily summary</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th style="text-align:right">Activities</th>
            <th style="text-align:right">Total time</th>
            <th>Top category</th>
          </tr>
        </thead>
        <tbody>${dailyRows || '<tr><td colspan="4">No life log entries this month.</td></tr>'}</tbody>
      </table>

      <div class="sub-heading">Activity log</div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Activity</th>
            <th>Category</th>
            <th style="text-align:right">Duration</th>
            <th>Mood</th>
            <th style="text-align:right">Energy</th>
            <th>Intent</th>
          </tr>
        </thead>
        <tbody>${activityRows || '<tr><td colspan="7">No activities logged.</td></tr>'}</tbody>
      </table>
      ${truncateNote}

      <div class="sub-heading">Focus sessions (Deep Work & Learning)</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Category</th>
            <th style="text-align:right">Duration</th>
          </tr>
        </thead>
        <tbody>${focusRows || '<tr><td colspan="4">No focus sessions logged.</td></tr>'}</tbody>
      </table>

      <div class="sub-heading">Mood summary</div>
      <div class="chart-box">${moodDonut}</div>
    </div>`;
}
