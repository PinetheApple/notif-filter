const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withPlugins,
  AndroidConfig,
} = require('@expo/config-plugins');

const { addPermission, removePermissions } = AndroidConfig.Permissions;
const { ensureToolsAvailable, getMainApplicationOrThrow } = AndroidConfig.Manifest;

const RELEASE_MANIFEST_DIR = path.join('app', 'src', 'release');
const RELEASE_MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
</manifest>
`;

function withNotifFilterService(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    ensureToolsAvailable(manifest);

    // Permissions
    addPermission(manifest, 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE');
    addPermission(manifest, 'android.permission.QUERY_ALL_PACKAGES');
    addPermission(manifest, 'android.permission.POST_NOTIFICATIONS');
    removePermissions(manifest, ['android.permission.INTERNET']);

    // Service declaration
    const app = getMainApplicationOrThrow(manifest);
    if (!app.service) {
      app.service = [];
    }

    const existing = app.service.find(
      (s) => s.$['android:name'] === 'app.notiffilter.NotifFilterService',
    );
    if (!existing) {
      app.service.push({
        $: {
          'android:name': 'app.notiffilter.NotifFilterService',
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.service.notification.default_filter_types',
              'android:value': 'conversations|alerting|silent|ongoing',
            },
          },
        ],
      });
    }

    return config;
  });
}

// removePermissions only drops the node from this manifest; libraries (expo-image,
// expo-file-system) re-add INTERNET at merge time, so release needs tools:node="remove".
function withoutInternetInRelease(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(config.modRequest.platformProjectRoot, RELEASE_MANIFEST_DIR);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(path.join(dir, 'AndroidManifest.xml'), RELEASE_MANIFEST);
      return config;
    },
  ]);
}

function withNotifFilter(config) {
  return withPlugins(config, [withNotifFilterService, withoutInternetInRelease]);
}

module.exports = withNotifFilter;
