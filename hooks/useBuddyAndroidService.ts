import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useStore } from '@/store';
import {
  registerBuddyBackgroundStop,
  subscribeNotifeeForegroundEvents,
} from '@/hooks/notifications/notifeeBackground';

const CHANNEL_ID = 'hey-buddy';
export const BUDDY_NOTIFICATION_ID = 'buddy-listening';

type NotifeeModule = typeof import('@notifee/react-native');

let notifeeLoadAttempted = false;
let notifeeModule: NotifeeModule | null = null;

async function loadNotifee(): Promise<NotifeeModule | null> {
  if (notifeeLoadAttempted) return notifeeModule;
  notifeeLoadAttempted = true;

  if (Platform.OS !== 'android' || isRunningInExpoGo()) {
    notifeeModule = null;
    return null;
  }

  try {
    notifeeModule = await import('@notifee/react-native');
    return notifeeModule;
  } catch {
    notifeeModule = null;
    return null;
  }
}

export async function stopBuddyForegroundService(
  opts?: { keepSettings?: boolean }
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const notifee = await loadNotifee();
  if (notifee) {
    await notifee.default.stopForegroundService().catch(() => undefined);
    await notifee.default.cancelNotification(BUDDY_NOTIFICATION_ID).catch(() => undefined);
  }

  if (!opts?.keepSettings) {
    useStore.getState().setBuddySettings({ lockScreenListen: false });
  }
}

export type AndroidServiceStartResult = {
  ok: boolean;
  error?: string;
};

export function useBuddyAndroidService() {
  const [serviceActive, setServiceActive] = useState(false);
  const [notifeeAvailable, setNotifeeAvailable] = useState<boolean | null>(null);
  const [lockScreenError, setLockScreenError] = useState<string | null>(null);
  const channelReadyRef = useRef(false);
  const foregroundSubRef = useRef<(() => void) | undefined>(undefined);

  const stopAndroidService = useCallback(async (opts?: { keepSettings?: boolean }) => {
    await stopBuddyForegroundService(opts);
    setServiceActive(false);
  }, []);

  useEffect(() => {
    registerBuddyBackgroundStop(stopAndroidService);
  }, [stopAndroidService]);

  const ensureChannel = useCallback(async (notifee: NotifeeModule) => {
    if (channelReadyRef.current || Platform.OS !== 'android') return;
    await notifee.default.createChannel({
      id: CHANNEL_ID,
      name: 'Hey Buddy',
      importance: notifee.AndroidImportance.LOW,
    });
    channelReadyRef.current = true;
  }, []);

  const startAndroidService = useCallback(async (): Promise<AndroidServiceStartResult> => {
    if (Platform.OS !== 'android') {
      return { ok: false, error: 'Android only' };
    }

    const notifee = await loadNotifee();
    setNotifeeAvailable(notifee !== null);

    if (!notifee) {
      const error = 'Lock screen unavailable — rebuild app';
      setLockScreenError(error);
      return { ok: false, error };
    }

    await ensureChannel(notifee);

    if (!foregroundSubRef.current) {
      foregroundSubRef.current = subscribeNotifeeForegroundEvents(notifee);
    }

    const settings = await notifee.default.requestPermission();
    if (settings.authorizationStatus === 0) {
      const error = 'Notification permission required';
      setLockScreenError(error);
      return { ok: false, error };
    }

    try {
      await notifee.default.displayNotification({
        id: BUDDY_NOTIFICATION_ID,
        title: 'Hey Buddy is listening',
        body: 'Say "Hey Buddy" or tap Stop to disable',
        android: {
          channelId: CHANNEL_ID,
          asForegroundService: true,
          foregroundServiceTypes: [
            notifee.AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
          ],
          ongoing: true,
          pressAction: { id: 'default' },
          actions: [
            {
              title: 'Stop',
              pressAction: { id: 'stop-buddy' },
            },
          ],
        },
      });
    } catch {
      const error = 'Could not start lock screen service';
      setLockScreenError(error);
      return { ok: false, error };
    }

    setLockScreenError(null);
    setServiceActive(true);
    return { ok: true };
  }, [ensureChannel]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    loadNotifee().then((notifee) => {
      setNotifeeAvailable(notifee !== null);
      if (!notifee || foregroundSubRef.current) return;
      foregroundSubRef.current = subscribeNotifeeForegroundEvents(notifee);
    });

    return () => foregroundSubRef.current?.();
  }, []);

  return {
    serviceActive,
    notifeeAvailable,
    lockScreenError,
    startAndroidService,
    stopAndroidService,
  };
}
