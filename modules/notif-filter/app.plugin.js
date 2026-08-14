const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
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

const ABI_PROPERTY = 'reactNativeArchitectures';
// x86/x86_64 are emulator-only and cost ~46 MB of the APK; real hardware is ARM.
const SHIPPED_ABIS = 'armeabi-v7a,arm64-v8a';

function withShippedAbis(config) {
  return withGradleProperties(config, (config) => {
    const existing = config.modResults.find(
      (item) => item.type === 'property' && item.key === ABI_PROPERTY,
    );

    if (existing) {
      existing.value = SHIPPED_ABIS;
    } else {
      config.modResults.push({ type: 'property', key: ABI_PROPERTY, value: SHIPPED_ABIS });
    }

    return config;
  });
}

const RES_CONFIG_MARKER = '// notif-filter: resource configurations';
// The UI ships English copy only, so AndroidX/Compose translations are dead weight.
// Appended as a second android {} block rather than spliced into the generated one.
const RES_CONFIG_BLOCK = `
${RES_CONFIG_MARKER}
android {
    defaultConfig {
        resourceConfigurations += ['en']
    }
}
`;

function withEnglishOnlyResources(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(RES_CONFIG_MARKER)) {
      config.modResults.contents += RES_CONFIG_BLOCK;
    }

    return config;
  });
}

const SIGNING_MARKER = '// notif-filter: release signing';
// PKCS12 keystores carry a single password, so store and key password are the same
// secret. Absent env vars keep the template's debug signing so local builds work.
const SIGNING_BLOCK = `
${SIGNING_MARKER}
def notifFilterKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
def notifFilterKeystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
def notifFilterKeyAlias = System.getenv("ANDROID_KEY_ALIAS")
def notifFilterCanSignRelease =
    notifFilterKeystorePath && notifFilterKeystorePassword && notifFilterKeyAlias

android {
    if (notifFilterCanSignRelease) {
        signingConfigs {
            release {
                storeFile file(notifFilterKeystorePath)
                storeType "pkcs12"
                storePassword notifFilterKeystorePassword
                keyAlias notifFilterKeyAlias
                keyPassword notifFilterKeystorePassword
            }
        }
        buildTypes {
            release {
                signingConfig signingConfigs.release
            }
        }
    } else {
        buildTypes {
            release {
                signingConfig signingConfigs.debug
            }
        }
    }
}

if (!notifFilterCanSignRelease) {
    logger.lifecycle("notif-filter: ANDROID_KEYSTORE_* unset, release builds are debug-signed")
}
`;

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(SIGNING_MARKER)) {
      config.modResults.contents += SIGNING_BLOCK;
    }

    return config;
  });
}

function withNotifFilterService(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    ensureToolsAvailable(manifest);

    // Permissions
    addPermission(manifest, 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE');
    addPermission(manifest, 'android.permission.QUERY_ALL_PACKAGES');
    addPermission(manifest, 'android.permission.POST_NOTIFICATIONS');
    addPermission(manifest, 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
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

// Each semver component gets this many slots, so 1.2.3 -> 10203 and the code rises
// monotonically with expo.version (release-please's single source of truth).
const VERSION_COMPONENT_SLOTS = 100;
const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

function withDerivedVersionCode(config) {
  const match = SEMVER_PATTERN.exec(config.version ?? '');
  if (!match) {
    throw new Error(
      `notif-filter: expo.version must be a semver string to derive an Android versionCode, got ${JSON.stringify(config.version)}`,
    );
  }

  const [, major, minor, patch] = match.map(Number);
  if (minor >= VERSION_COMPONENT_SLOTS || patch >= VERSION_COMPONENT_SLOTS) {
    throw new Error(
      `notif-filter: expo.version ${config.version} overflows ${VERSION_COMPONENT_SLOTS} slots per component`,
    );
  }

  config.android = config.android ?? {};
  if (config.android.versionCode == null) {
    config.android.versionCode =
      (major * VERSION_COMPONENT_SLOTS + minor) * VERSION_COMPONENT_SLOTS + patch;
  }

  return config;
}

function withNotifFilter(config) {
  return withPlugins(config, [
    withDerivedVersionCode,
    withNotifFilterService,
    withoutInternetInRelease,
    withShippedAbis,
    withEnglishOnlyResources,
    withReleaseSigning,
  ]);
}

module.exports = withNotifFilter;
