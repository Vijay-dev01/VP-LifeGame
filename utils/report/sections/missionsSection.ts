import type { ReportData } from '../reportData';
import { esc, sectionHeader, statCard } from '../reportTheme';

export function renderMissionsSection(data: ReportData): string {
  const missionBars = data.missionDaily
    .map(
      (d) => `
      <div class="bar-row">
        <div class="bar-label">${esc(d.label)}</div>
        <div class="bar-track"><span class="bar-fill" style="width:${d.pct}%;background:${d.color}"></span></div>
        <div class="bar-val">${d.pct}%</div>
      </div>`
    )
    .join('');

  const tableRows = data.missionDaily
    .filter((d) => d.total > 0)
    .map(
      (d) => `
      <tr>
        <td>${esc(d.label)}</td>
        <td class="num">${d.done}/${d.total}</td>
        <td class="num">${d.pct}%</td>
      </tr>`
    )
    .join('');

  return `
    <div class="section">
      ${sectionHeader('02', 'Missions')}
      <p class="section-desc">Daily task completion across the month</p>

      <div class="grid grid-2">
        ${statCard('Avg daily completion', `${data.avgMissionPct}%`, true)}
        ${statCard('Days in month', String(data.daysInMonth))}
        ${statCard('Best day', data.bestMissionDay ? `${data.bestMissionDay.pct}%` : '—')}
        ${statCard('Lowest day', data.worstMissionDay ? `${data.worstMissionDay.pct}%` : '—')}
      </div>

      <div class="chart-box">
        <div class="chart-title">Daily mission completion trend</div>
        ${missionBars || '<div class="empty">No mission data for this period.</div>'}
      </div>

      <div class="sub-heading">Mission log</div>
      <table>
        <thead>
          <tr><th>Date</th><th style="text-align:right">Done / Total</th><th style="text-align:right">%</th></tr>
        </thead>
        <tbody>${tableRows || '<tr><td colspan="3">No mission tasks logged.</td></tr>'}</tbody>
      </table>
    </div>`;
}
