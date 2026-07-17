import { Platform } from 'react-native';
import {
  AudioModule,
  type AudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

export type BuddyBackgroundSessionResult = {
  ok: boolean;
  error?: string;
};

let recorder: AudioRecorder | null = null;
let sessionActive = false;

export async function startBuddyBackgroundSession(): Promise<BuddyBackgroundSessionResult> {
  if (Platform.OS !== 'android') {
    return { ok: true };
  }

  if (sessionActive && recorder?.isRecording) {
    return { ok: true };
  }

  try {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      return { ok: false, error: 'Needs mic permission' };
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      allowsBackgroundRecording: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });

    if (!recorder) {
      recorder = new AudioModule.AudioRecorder(RecordingPresets.LOW_QUALITY);
    }

    const status = recorder.getStatus();
    if (!status.canRecord) {
      await recorder.prepareToRecordAsync();
    }

    if (!recorder.isRecording) {
      recorder.record();
    }

    sessionActive = true;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start background mic';
    return { ok: false, error: message };
  }
}

export async function stopBuddyBackgroundSession(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    if (recorder?.isRecording) {
      await recorder.stop();
    }
    recorder = null;
    sessionActive = false;

    await setAudioModeAsync({
      allowsRecording: false,
      allowsBackgroundRecording: false,
      shouldPlayInBackground: false,
    }).catch(() => undefined);
  } catch {
    sessionActive = false;
    recorder = null;
  }
}

export function isBuddyBackgroundSessionActive(): boolean {
  return sessionActive && (recorder?.isRecording ?? false);
}
