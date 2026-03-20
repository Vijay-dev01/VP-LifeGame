import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { addDays, endOfMonth, format, getDate, startOfMonth } from 'date-fns';
import { useStore } from '@/store';
import { computeMonthlyCompletionPercent, computeTotalDoneThisMonth } from '@/store';

function esc(v: string) {
  return v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function monthDates(monthStart: string) {
  const start = startOfMonth(new Date(monthStart + 'T12:00:00'));
  const end = endOfMonth(start);
  const out: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) out.push(new Date(d));
  return out;
}

function progressColor(percent: number) {
  if (percent >= 100) return '#22c55e';
  if (percent >= 50) return '#f59e0b';
  return '#ef4444';
}

function buildHtml(monthStart: string) {
  const s = useStore.getState();
  const dates = monthDates(monthStart);
  const monthLabel = format(new Date(monthStart + 'T12:00:00'), 'MMMM yyyy');

  const totalHabits = s.habits.length;
  const totalDone = computeTotalDoneThisMonth(s.completions, monthStart);
  const monthlyPct = computeMonthlyCompletionPercent(s.habits, s.completions, monthStart);

  const habitRows = s.habits
    .map((h) => {
      let done = 0;
      for (const d of dates) {
        const key = format(d, 'yyyy-MM-dd');
        if ((s.completions[key] ?? []).includes(h.id)) done++;
      }
      const pct = dates.length ? Math.round((done / dates.length) * 100) : 0;
      return { name: `${h.emoji} ${h.name}`, done, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const missionDaily = dates.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const tasks = s.dayTasks[key] ?? [];
    const done = tasks.filter((t) => t.done).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { key, label: format(d, 'dd MMM'), total: tasks.length, done, pct };
  });
  const avgMissionPct = missionDaily.length
    ? Math.round(missionDaily.reduce((acc, d) => acc + d.pct, 0) / missionDaily.length)
    : 0;

  const habitChart = habitRows
    .slice(0, 8)
    .map((r) => {
      const c = progressColor(r.pct);
      return `
      <div class="row">
        <div class="label">${esc(r.name)}</div>
        <div class="bar"><span style="width:${r.pct}%; background:${c}"></span></div>
        <div class="val">${r.pct}%</div>
      </div>`;
    })
    .join('');

  const missionChart = missionDaily
    .map((d) => {
      const c = progressColor(d.pct);
      return `
      <div class="row">
        <div class="label">${esc(d.label)}</div>
        <div class="bar"><span style="width:${d.pct}%; background:${c}"></span></div>
        <div class="val">${d.pct}%</div>
      </div>`;
    })
    .join('');

  const missionTable = missionDaily
    .filter((d) => d.total > 0)
    .map(
      (d) => `
      <tr>
        <td>${esc(d.label)}</td>
        <td>${d.done}/${d.total}</td>
        <td>${d.pct}%</td>
      </tr>`
    )
    .join('');

  const daysInMonth = getDate(endOfMonth(new Date(monthStart + 'T12:00:00')));

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 18mm 14mm; }
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      padding: 0;
      color: #e5e7eb;
      background: #0b1220;
    }
    .wrap { padding: 24px 18px; }

    .hero {
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 16px;
      padding: 18px 16px;
      background: linear-gradient(135deg, rgba(37,99,235,0.20), rgba(0,0,0,0)) , #0f172a;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      margin-bottom: 18px;
    }
    .heroTitle { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.2px; }
    .heroSub { margin-top: 6px; color: rgba(229,231,235,0.75); font-size: 13px; font-weight: 600; }

    h2 { margin: 18px 0 10px; font-size: 16px; font-weight: 800; letter-spacing: 0.2px; }
    .muted { color: rgba(229,231,235,0.68); font-size: 12px; font-weight: 600; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .grid2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }

    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 14px 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.22);
    }
    .k { color: rgba(229,231,235,0.65); font-size: 12px; margin-bottom: 6px; font-weight: 700; }
    .v { font-size: 28px; font-weight: 900; }

    .row { display: grid; grid-template-columns: 220px 1fr 56px; align-items: center; gap: 12px; margin: 7px 0; }
    .label { color: rgba(229,231,235,0.85); font-weight: 700; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .val { text-align: right; font-weight: 900; font-size: 12px; color: rgba(229,231,235,0.9); }

    .bar { height: 10px; background: rgba(255,255,255,0.10); border-radius: 999px; overflow: hidden; }
    .bar > span { display:block; height:100%; border-radius: 999px; background:#2563eb; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; overflow: hidden; border-radius: 14px; }
    th, td { border: 1px solid rgba(255,255,255,0.10); padding: 9px 10px; text-align: left; font-size: 12px; }
    th { background: rgba(255,255,255,0.06); }
    tbody tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div class="heroTitle">VPRIME Monthly Report</div>
      <div class="heroSub">${esc(monthLabel)}</div>
    </div>

    <h2>Dashboard Overview</h2>
    <div class="grid">
      <div class="card"><div class="k">Habits</div><div class="v">${totalHabits}</div></div>
      <div class="card"><div class="k">Habit Completions</div><div class="v">${totalDone}</div></div>
      <div class="card"><div class="k">Global Progress</div><div class="v">${monthlyPct}%</div></div>
    </div>

    <h2>Habit Tracker Charts</h2>
    <div class="muted">Monthly progress by habit</div>
    ${habitChart || '<div class="muted">No habits found for this period.</div>'}

    <h2>Mission Task Analytics</h2>
    <div class="grid2">
      <div class="card"><div class="k">Average Daily Completion</div><div class="v">${avgMissionPct}%</div></div>
      <div class="card"><div class="k">Days in Month</div><div class="v">${daysInMonth}</div></div>
    </div>
    <div class="muted" style="margin-top:10px">Daily completion trend</div>
    ${missionChart || '<div class="muted">No mission data for this period.</div>'}

    <table>
      <thead><tr><th style="width:34%">Date</th><th style="width:33%">Done / Total</th><th style="width:33%">Completion %</th></tr></thead>
      <tbody>${missionTable || '<tr><td colspan="3">No mission tasks logged.</td></tr>'}</tbody>
    </table>
  </div>
</body>
</html>`;
}

export async function generateMonthlyPdf(monthStart: string) {
  const html = buildHtml(monthStart);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareMonthlyPdf(monthStart: string) {
  const uri = await generateMonthlyPdf(monthStart);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `VPRIME Report ${format(new Date(monthStart + 'T12:00:00'), 'MMMM yyyy')}`,
    });
  }
  return uri;
}

export async function emailMonthlyPdf(monthStart: string, recipient: string) {
  const uri = await generateMonthlyPdf(monthStart);
  const canMail = await MailComposer.isAvailableAsync();
  if (!canMail) return { ok: false as const, reason: 'mail_unavailable' };

  const monthLabel = format(new Date(monthStart + 'T12:00:00'), 'MMMM yyyy');
  const res = await MailComposer.composeAsync({
    recipients: [recipient],
    subject: `VPRIME Monthly Report - ${monthLabel}`,
    body: `Attached is your VPRIME monthly report for ${monthLabel}.`,
    attachments: [uri],
  });
  return { ok: true as const, status: res.status };
}
