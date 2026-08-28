const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const NOTIFEE_SERVICE = 'app.notifee.core.ForegroundService';
const SPECIAL_USE_DESCRIPTION =
  'Displays live elapsed time for an active Life Log activity timer';

function withNotifeeForegroundService(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults;

    if (!manifest.manifest.$) {
      manifest.manifest.$ = {};
    }
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const services = application.service ?? [];

    application.service = services.filter(
      (service) => service.$?.['android:name'] !== NOTIFEE_SERVICE
    );

    application.service.push({
      $: {
        'android:name': NOTIFEE_SERVICE,
        'android:foregroundServiceType': 'microphone|specialUse',
        'tools:replace': 'android:foregroundServiceType',
      },
      property: [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': SPECIAL_USE_DESCRIPTION,
          },
        },
      ],
    });

    return modConfig;
  });
}

module.exports = withNotifeeForegroundService;
