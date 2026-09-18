import { parseBuddyCommand } from '../utils/buddyCommandsCore';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const startCoding = parseBuddyCommand('hey buddy start coding', [], { allowWake: true });
assert(startCoding?.type === 'start_timer', 'combined wake phrase should start timer');
if (startCoding?.type === 'start_timer') {
  assert(startCoding.title === 'coding', 'should resolve coding activity');
  assert(startCoding.category === 'deep-work', 'coding should map to deep-work');
}

const wakeOnly = parseBuddyCommand('hey buddy', [], { allowWake: true });
assert(wakeOnly?.type === 'wake', 'hey buddy alone should wake');

const bareStart = parseBuddyCommand('start coding', [], { allowWake: false });
assert(bareStart?.type === 'start_timer', 'start coding should start timer');

const stopCmd = parseBuddyCommand('stop', [], { allowWake: false });
assert(stopCmd?.type === 'stop_timer', 'stop should stop timer');

console.log('buddyCommands tests passed');
