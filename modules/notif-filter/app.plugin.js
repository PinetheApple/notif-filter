const {
  withAndroidManifest,
  withPlugins,
  AndroidConfig,
} = require('@expo/config-plugins');

const { addPermission, removePermissions, getMainApplicationOrThrow } =
  AndroidConfig.Permissions;
const { ensureToolsAvailable } = AndroidConfig.Manifest;

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
          'android:permission':
            'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name':
                'android.service.notification.default_filter_types',
              'android:value':
                'conversations|alerting|silent|ongoing',
            },
          },
        ],
      });
    }

    return config;
  });
}

function withNotifFilter(config) {
  return withPlugins(config, [withNotifFilterService]);
}

module.exports = withNotifFilter;
