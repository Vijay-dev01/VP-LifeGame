const { Platform } = require('react-native');

if (Platform.OS === 'android') {
  try {
    const notifee = require('@notifee/react-native').default;
    const { EventType } = require('@notifee/react-native');
    const {
      dispatchNotifeeBackgroundAction,
    } = require('./hooks/notifications/notifeeBackground');

    notifee.registerForegroundService(() => new Promise(() => {}));

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type !== EventType.ACTION_PRESS) return;
      await dispatchNotifeeBackgroundAction(detail.pressAction?.id);
    });
  } catch {
    // Notifee unavailable (Expo Go / misconfigured build)
  }
}

require('expo-router/entry');
