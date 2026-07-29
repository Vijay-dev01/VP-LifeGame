import { format, parse } from 'date-fns';

export function formatPlanTime(time: string): string {
  try {
    const d = parse(time, 'HH:mm', new Date());
    return format(d, 'h:mm a');
  } catch {
    return time;
  }
}
