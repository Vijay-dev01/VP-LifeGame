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
    .map(
      (r) => `
      <div class="row">
        <div class="label">${esc(r.name)}</div>
        <div class="bar"><span style="width:${r.pct}%"></span></div>
        <div class="val">${r.pct}%</div>
      </div>`
    )
    .join('');

  const missionChart = missionDaily
    .map(
      (d) => `
      <div class="row">
        <div class="label">${esc(d.label)}</div>
        <div class="bar"><span style="width:${d.pct}%"></span></div>
        <div class="val">${d.pct}%</div>
      </div>`
    )
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

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0 0 8px; }
    h2 { margin: 24px 0 10px; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
    .k { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
    .v { font-size: 24px; font-weight: 700; }
    .row { display: grid; grid-template-columns: 220px 1fr 48px; align-items: center; gap: 10px; margin: 6px 0; }
    .bar { height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .bar > span { display:block; height:100%; background:#2563eb; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>VPRIME Monthly Report</h1>
  <div class="muted">${esc(monthLabel)}</div>

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
  <div class="grid" style="grid-template-columns: repeat(2,1fr)">
    <div class="card"><div class="k">Average Daily Completion</div><div class="v">${avgMissionPct}%</div></div>
    <div class="card"><div class="k">Days in Month</div><div class="v">${getDate(endOfMonth(new Date(monthStart + 'T12:00:00')))}</div></div>
  </div>
  <div class="muted" style="margin-top:10px">Daily completion trend</div>
  ${missionChart || '<div class="muted">No mission data for this period.</div>'}

  <table>
    <thead><tr><th>Date</th><th>Done / Total</th><th>Completion %</th></tr></thead>
    <tbody>${missionTable || '<tr><td colspan="3">No mission tasks logged.</td></tr>'}</tbody>
  </table>
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
