export const reportColors = {
  bg: '#0a0a0a',
  surface: '#171717',
  surfaceLight: '#1a1a1a',
  accent: '#dc2626',
  accentDark: '#b91c1c',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  border: 'rgba(255,255,255,0.08)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

export function esc(v: string): string {
  return v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function progressColor(percent: number): string {
  if (percent >= 100) return reportColors.green;
  if (percent >= 50) return reportColors.amber;
  return reportColors.red;
}

export function reportStyles(): string {
  return `
    @page {
      size: A4;
      margin: 18mm 14mm 24mm 14mm;
      @bottom-center {
        content: "Page " counter(page);
        font-size: 9px;
        color: rgba(255,255,255,0.45);
      }
    }
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: ${reportColors.text};
      background: ${reportColors.bg};
      font-size: 13px;
      line-height: 1.45;
    }
    .doc-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 0;
      font-size: 9px;
      color: rgba(255,255,255,0.45);
      border-top: 1px solid ${reportColors.border};
      background: ${reportColors.bg};
      display: flex;
      justify-content: space-between;
    }
    .doc-footer span { flex: 1; }
    .doc-footer .center { text-align: center; }
    .doc-footer .right { text-align: right; }
    .wrap { padding: 0 4px 32px; }
    .hero {
      border: 1px solid ${reportColors.border};
      border-radius: 20px;
      padding: 28px 24px;
      margin-bottom: 28px;
      background: linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(0,0,0,0) 55%), ${reportColors.surface};
      page-break-inside: avoid;
    }
    .hero-brand {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 3px;
      color: ${reportColors.accent};
      margin-bottom: 8px;
    }
    .hero-title {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .hero-sub {
      margin-top: 8px;
      color: ${reportColors.textMuted};
      font-size: 15px;
      font-weight: 600;
    }
    .hero-meta {
      margin-top: 14px;
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      font-weight: 600;
    }
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .section-break { page-break-before: always; padding-top: 8px; }
    .section-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 16px;
      border-left: 4px solid ${reportColors.accent};
      padding-left: 14px;
    }
    .section-num {
      font-size: 11px;
      font-weight: 800;
      color: ${reportColors.accent};
      letter-spacing: 1px;
    }
    .section-title {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .section-desc {
      color: ${reportColors.textMuted};
      font-size: 12px;
      font-weight: 600;
      margin: -8px 0 14px 18px;
    }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .card {
      background: ${reportColors.surface};
      border: 1px solid ${reportColors.border};
      border-radius: 14px;
      padding: 14px 12px;
      page-break-inside: avoid;
    }
    .card-k {
      color: ${reportColors.textMuted};
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }
    .card-v {
      font-size: 26px;
      font-weight: 900;
      color: ${reportColors.text};
    }
    .card-v.accent { color: ${reportColors.accent}; }
    .chart-box {
      background: ${reportColors.surface};
      border: 1px solid ${reportColors.border};
      border-radius: 14px;
      padding: 16px;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    .chart-title {
      font-size: 11px;
      font-weight: 700;
      color: ${reportColors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 12px;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 140px 1fr 48px;
      align-items: center;
      gap: 10px;
      margin: 6px 0;
    }
    .bar-label {
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,0.85);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar-track {
      height: 10px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      display: block;
      height: 100%;
      border-radius: 999px;
    }
    .bar-val {
      text-align: right;
      font-size: 11px;
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      border-radius: 12px;
      overflow: hidden;
      page-break-inside: auto;
    }
    th, td {
      border: 1px solid ${reportColors.border};
      padding: 9px 11px;
      font-size: 11px;
      text-align: left;
    }
    th {
      background: ${reportColors.surfaceLight};
      font-weight: 800;
      color: ${reportColors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 10px;
    }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tbody tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
    .empty {
      color: ${reportColors.textMuted};
      font-size: 12px;
      font-weight: 600;
      padding: 16px;
      text-align: center;
      background: ${reportColors.surface};
      border-radius: 12px;
      border: 1px dashed ${reportColors.border};
    }
    .insights { margin-top: 12px; }
    .insight-item {
      background: rgba(220,38,38,0.08);
      border: 1px solid rgba(220,38,38,0.2);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .footnote {
      font-size: 10px;
      color: ${reportColors.textMuted};
      margin-top: 8px;
      font-style: italic;
    }
    .sub-heading {
      font-size: 13px;
      font-weight: 800;
      margin: 18px 0 10px;
      color: rgba(255,255,255,0.9);
    }
  `;
}

export function sectionHeader(num: string, title: string): string {
  return `
    <div class="section-header">
      <span class="section-num">${esc(num)}</span>
      <h2 class="section-title">${esc(title)}</h2>
    </div>`;
}

export function statCard(label: string, value: string, accent = false): string {
  return `
    <div class="card">
      <div class="card-k">${esc(label)}</div>
      <div class="card-v${accent ? ' accent' : ''}">${esc(value)}</div>
    </div>`;
}
