import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { format } from 'date-fns';
import { buildReportHtml } from './report/reportHtml';

export async function generateMonthlyPdf(monthStart: string) {
  const html = buildReportHtml(monthStart);
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
