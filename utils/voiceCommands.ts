import { parseBuddyCommand, BUDDY_CONTEXTUAL_STRINGS } from '@/utils/buddyCommands';

export interface VoiceCommandResult {
  action: 'start' | 'stop';
  category: string;
  title: string;
}

export function parseVoiceCommand(transcript: string): VoiceCommandResult | null {
  const cmd = parseBuddyCommand(transcript, { allowWake: false });
  if (!cmd) return null;
  if (cmd.type === 'start_timer') {
    return { action: 'start', category: cmd.category, title: cmd.title };
  }
  if (cmd.type === 'stop_timer') {
    return { action: 'stop', category: 'deep-work', title: 'activity' };
  }
  return null;
}

export const VOICE_CONTEXTUAL_STRINGS = BUDDY_CONTEXTUAL_STRINGS;
