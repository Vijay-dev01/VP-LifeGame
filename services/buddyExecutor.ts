import { addDays, format } from 'date-fns';
import { useStore } from '@/store';
import { parseBuddyCommand, type BuddyCommand } from '@/utils/buddyCommands';

export interface BuddyExecutionResult {
  reply: string;
  success: boolean;
}

function dateKeyFor(relative: 'today' | 'tomorrow'): string {
  const base = relative === 'tomorrow' ? addDays(new Date(), 1) : new Date();
  return format(base, 'yyyy-MM-dd');
}

export function executeBuddyCommand(command: BuddyCommand): BuddyExecutionResult {
  const state = useStore.getState();
  const userName = state.buddySettings.userName || 'Vijay';

  switch (command.type) {
    case 'wake':
      return {
        success: true,
        reply: `Hey ${userName}, what can I do for you?`,
      };

    case 'start_timer': {
      if (state.activeTimer) {
        return { success: false, reply: 'A timer is already running. Say stop first.' };
      }
      state.startTimer(command.category, command.title);
      return { success: true, reply: `Started ${command.title} timer.` };
    }

    case 'stop_timer': {
      if (!state.activeTimer) {
        return { success: false, reply: 'No timer is running.' };
      }
      state.stopTimer({ title: state.activeTimer.title });
      return { success: true, reply: 'Timer stopped.' };
    }

    case 'add_tasks': {
      const date = dateKeyFor(command.date);
      const added = state.addTasksBulk(date, command.titles);
      if (added === 0) {
        return { success: false, reply: "I didn't catch any task names." };
      }
      const label = command.date === 'tomorrow' ? 'tomorrow' : 'today';
      return {
        success: true,
        reply: `Added ${added} task${added === 1 ? '' : 's'} for ${label}.`,
      };
    }

    case 'complete_task': {
      const result = state.completeTaskByTitle(command.query);
      if (!result.found || !result.title) {
        return {
          success: false,
          reply: `Couldn't find a task matching ${command.query}.`,
        };
      }
      return { success: true, reply: `Marked ${result.title} as complete.` };
    }

    default:
      return { success: false, reply: "Sorry, I didn't understand that." };
  }
}

export function processBuddyTranscript(
  transcript: string,
  options?: { allowWake?: boolean }
): BuddyExecutionResult | null {
  const command = parseBuddyCommand(transcript, options);
  if (!command) return null;
  return executeBuddyCommand(command);
}
