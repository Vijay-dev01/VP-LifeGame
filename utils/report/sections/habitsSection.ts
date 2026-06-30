import { renderSparkline } from '../charts';
import type { ReportData } from '../reportData';
import { esc, sectionHeader } from '../reportTheme';

export function renderHabitsSection(data: ReportData): string {
  const topHabits = data.habitRows.slice(0, 10);
  const barItems = topHabits.map((h) => ({
    label: h.name,
    value: h.pct,
    max: 100,
    color: h.color,
  }));

  const sparkPoints = data.consistencyTrend.map((p) => ({
    value: p.count,
    label: String(p.day),
  }));

  const habitBars =
    topHabits.length > 0
      ? topHabits
          .map(
            (h) => `
        <div class="bar-row">
          <div class="bar-label">${esc(h.name)}</div>
          <div class="bar-track"><span class="bar-fill" style="width:${h.pct}%;background:${h.color}"></span></div>
          <div class="bar-val">${h.pct}%</div>
        </div>`
          )
          .join('')
      : '';

  const tableRows = data.habitRows
    .map(
      (h) => `
      <tr>
        <td>${esc(h.name)}</td>
        <td class="num">${h.done}</td>
        <td class="num">${h.pct}%</td>
      </tr>`
    )
    .join('');

  return `
    <div class="section">
      ${sectionHeader('01', 'Habits')}
      <p class="section-desc">Monthly habit completion and daily consistency</p>

      <div class="chart-box">
        <div class="chart-title">Top habits by completion %</div>
        ${habitBars || '<div class="empty">No habits tracked this month.</div>'}
      </div>

      <div class="chart-box">
        <div class="chart-title">Daily check-in consistency</div>
        ${sparkPoints.length > 0 ? renderSparkline(sparkPoints) : '<div class="empty">No check-in data.</div>'}
      </div>

      <div class="sub-heading">Habit ranking</div>
      <table>
        <thead>
          <tr><th>Habit</th><th style="text-align:right">Days done</th><th style="text-align:right">%</th></tr>
        </thead>
        <tbody>${tableRows || '<tr><td colspan="3">No habits found.</td></tr>'}</tbody>
      </table>
    </div>`;
}
