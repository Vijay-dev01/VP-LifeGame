import * as Speech from 'expo-speech';

let speaking = false;
let pending: string[] = [];

function flushNext() {
  if (speaking || pending.length === 0) return;
  const text = pending.shift()!;
  speaking = true;
  Speech.speak(text, {
    language: 'en-US',
    rate: 1,
    onDone: () => {
      speaking = false;
      flushNext();
    },
    onStopped: () => {
      speaking = false;
      flushNext();
    },
    onError: () => {
      speaking = false;
      flushNext();
    },
  });
}

export function speakBuddy(text: string) {
  pending.push(text);
  flushNext();
}

export function stopBuddySpeech() {
  Speech.stop();
  speaking = false;
  pending = [];
}

export function isBuddySpeaking() {
  return speaking;
}
