import { buildReportData } from './reportData';
import { reportStyles, esc } from './reportTheme';
import { renderSummarySection } from './sections/summarySection';
import { renderHabitsSection } from './sections/habitsSection';
import { renderMissionsSection } from './sections/missionsSection';
import { renderLifeLogSection } from './sections/lifeLogSection';
import { renderLifeAnalyticsSection } from './sections/lifeAnalyticsSection';

export function buildReportHtml(monthStart: string): string {
  const data = buildReportData(monthStart);

  const hero = `
    <div class="hero">
      <div class="hero-brand">VPRIME</div>
      <h1 class="hero-title">Monthly Performance Report</h1>
      <div class="hero-sub">${esc(data.monthLabel)}</div>
      <div class="hero-meta">Generated ${esc(data.generatedAt)}</div>
    </div>`;

  const footer = `
    <div class="doc-footer">
      <span>VPRIME · ${esc(data.monthLabel)}</span>
      <span class="center"></span>
      <span class="right">${esc(data.generatedAt)}</span>
    </div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${reportStyles()}</style>
</head>
<body>
  ${footer}
  <div class="wrap">
    ${hero}
    ${renderSummarySection(data)}
    ${renderHabitsSection(data)}
    ${renderMissionsSection(data)}
    ${renderLifeLogSection(data)}
    ${renderLifeAnalyticsSection(data)}
  </div>
</body>
</html>`;
}
