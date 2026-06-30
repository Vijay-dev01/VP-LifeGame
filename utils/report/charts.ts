export interface BarChartItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface SparklinePoint {
  value: number;
  label?: string;
}

export function renderBarChart(
  items: BarChartItem[],
  opts: { width?: number; height?: number; barHeight?: number } = {}
): string {
  if (items.length === 0) return '';
  const width = opts.width ?? 520;
  const barHeight = opts.barHeight ?? 14;
  const gap = 6;
  const labelW = 120;
  const valW = 40;
  const barW = width - labelW - valW - 20;
  const maxVal = Math.max(...items.map((i) => i.max ?? i.value), 1);

  const rows = items
    .map((item, idx) => {
      const pct = Math.min(100, (item.value / maxVal) * 100);
      const y = idx * (barHeight + gap);
      const color = item.color ?? '#dc2626';
      return `
        <text x="0" y="${y + barHeight - 3}" fill="rgba(255,255,255,0.85)" font-size="10" font-weight="600">${escapeXml(truncate(item.label, 18))}</text>
        <rect x="${labelW}" y="${y}" width="${barW}" height="${barHeight}" rx="7" fill="rgba(255,255,255,0.08)"/>
        <rect x="${labelW}" y="${y}" width="${(barW * pct) / 100}" height="${barHeight}" rx="7" fill="${color}"/>
        <text x="${labelW + barW + 8}" y="${y + barHeight - 3}" fill="rgba(255,255,255,0.75)" font-size="10" font-weight="700" text-anchor="start">${item.value}</text>`;
    })
    .join('');

  const height = items.length * (barHeight + gap);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rows}</svg>`;
}

export function renderSparkline(
  points: SparklinePoint[],
  opts: { width?: number; height?: number; color?: string } = {}
): string {
  if (points.length === 0) return '';
  const width = opts.width ?? 520;
  const height = opts.height ?? 80;
  const color = opts.color ?? '#dc2626';
  const pad = 8;
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = height - pad - (p.value / max) * (height - pad * 2);
    return `${x},${y}`;
  });

  const area = `${pad},${height - pad} ${coords.join(' ')} ${pad + (points.length - 1) * step},${height - pad}`;
  const dots = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = height - pad - (p.value / max) * (height - pad * 2);
      return `<circle cx="${x}" cy="${y}" r="2.5" fill="${color}"/>`;
    })
    .join('');

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${area}" fill="${color}" fill-opacity="0.12"/>
      <polyline points="${coords.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
    </svg>`;
}

export function renderDonutChart(
  segments: DonutSegment[],
  opts: { size?: number; strokeWidth?: number } = {}
): string {
  const filtered = segments.filter((s) => s.value > 0);
  if (filtered.length === 0) return '';

  const size = opts.size ?? 140;
  const stroke = opts.strokeWidth ?? 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = filtered.reduce((s, seg) => s + seg.value, 0);
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = filtered
    .map((seg) => {
      const pct = seg.value / total;
      const dash = pct * circumference;
      const arc = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}"
          stroke-width="${stroke}" stroke-dasharray="${dash} ${circumference - dash}"
          stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += dash;
      return arc;
    })
    .join('');

  const legend = filtered
    .map(
      (seg) =>
        `<div style="display:flex;align-items:center;gap:6px;margin:4px 0;font-size:10px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${seg.color};display:inline-block;"></span>
          <span>${escapeXml(seg.label)} (${seg.value})</span>
        </div>`
    )
    .join('');

  return `
    <div style="display:flex;align-items:center;gap:20px;">
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${stroke}"/>
        ${arcs}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#f5f5f5" font-size="14" font-weight="800">${total}</text>
      </svg>
      <div>${legend}</div>
    </div>`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
