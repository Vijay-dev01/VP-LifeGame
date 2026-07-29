import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useStore } from '@/store';

const CHANNEL_ID = 'hey-buddy';
const NOTIFICATION_ID = 'buddy-listening';

type NotifeeModule = typeof import('@notifee/react-native');

let notifeeLoadAttempted = false;
let notifeeModule: NotifeeModule | null = null;
let backgroundHandlerRegistered = false;

const stopRef = { current: async () => undefined as void | Promise<void> };

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

async function registerBackgroundStopHandler(notifee: NotifeeModule) {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  notifee.default.onBackgroundEvent(async ({ type, detail }) => {
    if (type === notifee.EventType.ACTION_PRESS && detail.pressAction?.id === 'stop-buddy') {
      await stopRef.current();
    }
  });
}

if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  loadNotifee()
    .then((notifee) => {
      if (notifee) registerBackgroundStopHandler(notifee);
    })
    .catch(() => undefined);
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

  const stopAndroidService = useCallback(async (opts?: { keepSettings?: boolean }) => {
    if (Platform.OS !== 'android') return;

    const notifee = await loadNotifee();
    if (notifee) {
      await notifee.default.stopForegroundService().catch(() => undefined);
      await notifee.default.cancelNotification(NOTIFICATION_ID).catch(() => undefined);
    }

    setServiceActive(false);
    if (!opts?.keepSettings) {
      useStore.getState().setBuddySettings({ lockScreenListen: false });
    }
  }, []);

  useEffect(() => {
    stopRef.current = stopAndroidService;
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

    await registerBackgroundStopHandler(notifee);
    await ensureChannel(notifee);

    const settings = await notifee.default.requestPermission();
    if (settings.authorizationStatus === 0) {
      const error = 'Notification permission required';
      setLockScreenError(error);
      return { ok: false, error };
    }

    await notifee.default.displayNotification({
      id: NOTIFICATION_ID,
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

    setLockScreenError(null);
    setServiceActive(true);
    return { ok: true };
  }, [ensureChannel]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let unsubscribe: (() => void) | undefined;

    loadNotifee().then((notifee) => {
      setNotifeeAvailable(notifee !== null);
      if (!notifee) return;

      registerBackgroundStopHandler(notifee);

      unsubscribe = notifee.default.onForegroundEvent(({ type, detail }) => {
        if (type === notifee.EventType.ACTION_PRESS && detail.pressAction?.id === 'stop-buddy') {
          stopRef.current();
        }
      });
    });

    return () => unsubscribe?.();
  }, []);

  return {
    serviceActive,
    notifeeAvailable,
    lockScreenError,
    startAndroidService,
    stopAndroidService,
  };
}
