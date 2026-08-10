#!/usr/bin/env bash
# Builds the release variant and installs it on the attached device.
#
# Release rather than debug on purpose: a debug build loads JS from a Metro packager and
# is useless the moment that packager stops, which is not something you want on a phone
# you actually rely on.
set -uo pipefail

EXIT_FAILED=1
EXIT_USAGE=2

SKIP_BUILD=0

usage() {
  cat >&2 <<'EOF'
usage: install-on-device.sh [--skip-build]

Builds the release APK and installs it on the attached device, then reports which
signing key was used and whether notification access survived.

  --skip-build  install the APK already in android/app/build/outputs/apk/release
EOF
  exit "$EXIT_USAGE"
}

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    -h | --help) usage ;;
    *)
      echo "unknown option: $arg" >&2
      usage
      ;;
  esac
done

cd "$(dirname "$0")/.."

APK=android/app/build/outputs/apk/release/app-release.apk
LISTENER=app.notiffilter/app.notiffilter.NotifFilterService
PACKAGE=app.notiffilter

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
fail() {
  printf '\033[31m%s\033[0m\n' "$1" >&2
  exit "$EXIT_FAILED"
}

command -v adb >/dev/null || fail "adb not found on PATH"

DEVICES=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
[ -z "$DEVICES" ] && fail "no device attached (check 'adb devices' and USB debugging)"
[ "$(echo "$DEVICES" | wc -l)" -gt 1 ] && fail "more than one device attached; disconnect the others"
printf 'device: %s\n' "$DEVICES"

if [ "$SKIP_BUILD" -eq 0 ]; then
  step "Building release APK"
  # Stale output would otherwise be silently reinstalled if the build no-ops.
  rm -f "$APK"
  # Via the Expo CLI, not gradlew: it is what loads .env, and the signing config reads
  # ANDROID_KEYSTORE_* through Gradle's System.getenv. Bare gradlew debug-signs instead.
  # The install it attempts may fail on a signature change; that is handled below.
  pnpm expo run:android --variant release --no-bundler >/dev/null 2>&1 || true
fi

[ -f "$APK" ] || fail "no APK at $APK — the build failed, run 'pnpm expo run:android --variant release' to see why"

step "Signing key"
APKSIGNER=$(command -v apksigner || ls -d "${ANDROID_HOME:-/opt/android-sdk}"/build-tools/*/apksigner 2>/dev/null | sort -V | tail -1)
if [ -n "$APKSIGNER" ] && [ -x "$APKSIGNER" ]; then
  DIGEST=$("$APKSIGNER" verify --print-certs "$APK" 2>/dev/null |
    grep -im1 'SHA-256 digest' | awk '{print $NF}')
  # The template keystore Gradle's signingConfigs.debug points at, not
  # ~/.android/debug.keystore — they are different keys and only this one signs builds here.
  DEBUG_DIGEST=""
  DEBUG_KEYSTORE=android/app/debug.keystore
  if [ -f "$DEBUG_KEYSTORE" ]; then
    DEBUG_DIGEST=$(keytool -list -v -keystore "$DEBUG_KEYSTORE" \
      -storepass android -alias androiddebugkey 2>/dev/null |
      grep -im1 'SHA256:' | awk '{print $2}' | tr -d ':' | tr '[:upper:]' '[:lower:]')
  fi
  if [ -n "$DIGEST" ] && [ "$DIGEST" = "$DEBUG_DIGEST" ]; then
    printf '\033[33mdebug key\033[0m — set ANDROID_KEYSTORE_* in .env for a real signed build\n'
  else
    printf 'signed with %s…\n' "${DIGEST:0:16}"
  fi
else
  printf 'apksigner not found, skipping key check\n'
fi

step "Installing"
INSTALL_OUT=$(adb install -r "$APK" 2>&1)
if echo "$INSTALL_OUT" | grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE"; then
  cat >&2 <<EOF

$(printf '\033[31mSignature mismatch.\033[0m') The installed app was signed with a different key.

Installing this build means uninstalling first, which erases all rules and history on
the device. Back them up before you do:

  adb shell run-as $PACKAGE cat shared_prefs/notif_filter_rules.xml > rules-backup.xml

That only works if the installed build is debuggable. If it is not, export the rules
from Settings first, then:

  adb uninstall $PACKAGE && $0 --skip-build
EOF
  exit "$EXIT_FAILED"
fi
echo "$INSTALL_OUT" | grep -qi success || fail "install failed:\n$INSTALL_OUT"
printf 'installed\n'

step "Notification access"
if adb shell settings get secure enabled_notification_listeners 2>/dev/null | grep -q "$PACKAGE"; then
  printf 'granted\n'
else
  printf 'not granted, requesting\n'
  adb shell cmd notification allow_listener "$LISTENER" >/dev/null 2>&1
  sleep 1
  if adb shell settings get secure enabled_notification_listeners 2>/dev/null | grep -q "$PACKAGE"; then
    printf 'granted\n'
  else
    # Filtering is silently dead without this, so it is worth an explicit warning.
    printf '\033[33mstill not granted — enable it in Settings > Notifications > Special access\033[0m\n'
  fi
fi

step "Version"
adb shell dumpsys package "$PACKAGE" 2>/dev/null | grep -m1 versionName | tr -d ' '

printf '\n\033[32mDone.\033[0m\n'
