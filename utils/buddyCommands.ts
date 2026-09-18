import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';
import {
  parseBuddyCommand as parseBuddyCommandCore,
  type BuddyCommand,
} from '@/utils/buddyCommandsCore';

export type { BuddyCommand };
export { containsWakePhrase, splitTaskTitles } from '@/utils/buddyCommandsCore';

const CATEGORY_HINTS = LIFE_LOG_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  examples: c.examples,
}));

export function parseBuddyCommand(
  transcript: string,
  options?: { allowWake?: boolean }
): BuddyCommand | null {
  return parseBuddyCommandCore(transcript, CATEGORY_HINTS, options);
}

export const BUDDY_CONTEXTUAL_STRINGS = [
  'hey buddy',
  'tomorrow',
  'today',
  'complete',
  'done',
  'stop',
  'start',
  'running',
  'reading',
  'dancing',
  'coding',
  'add tomorrow',
  ...LIFE_LOG_CATEGORIES.flatMap((c) => [c.label, ...c.examples]),
];
