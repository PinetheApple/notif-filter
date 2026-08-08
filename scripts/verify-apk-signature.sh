#!/usr/bin/env bash
# Fails when the APK is unsigned or signed with the template debug key. The first key
# published is locked in forever, so a debug-signed release must never leave CI.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: verify-apk-signature.sh <apk> <debug-keystore>" >&2
  exit 2
fi

APK="$1"
DEBUG_KEYSTORE="$2"
DEBUG_KEYSTORE_PASSWORD="android"
DEBUG_KEY_ALIAS="androiddebugkey"

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "ANDROID_HOME is not set" >&2
  exit 2
fi

APKSIGNER="$(find "$ANDROID_HOME/build-tools" -maxdepth 2 -name apksigner -type f | sort -V | tail -n 1)"
if [ -z "$APKSIGNER" ]; then
  echo "apksigner not found under $ANDROID_HOME/build-tools" >&2
  exit 2
fi

normalise_digest() {
  tr -d ':' | tr '[:upper:]' '[:lower:]'
}

"$APKSIGNER" verify --verbose "$APK"

apk_digest="$(
  "$APKSIGNER" verify --print-certs "$APK" |
    grep -m 1 'Signer #1 certificate SHA-256 digest:' |
    awk '{ print $NF }' |
    normalise_digest
)"

debug_digest="$(
  keytool -list -keystore "$DEBUG_KEYSTORE" \
    -storepass "$DEBUG_KEYSTORE_PASSWORD" \
    -alias "$DEBUG_KEY_ALIAS" |
    grep -m 1 -oE '[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){31}' |
    normalise_digest
)"

if [ -z "$apk_digest" ] || [ -z "$debug_digest" ]; then
  echo "could not read a certificate digest from the APK or the debug keystore" >&2
  exit 2
fi

if [ "$apk_digest" = "$debug_digest" ]; then
  echo "APK is signed with the debug key ($apk_digest)" >&2
  exit 1
fi

echo "APK signer SHA-256: $apk_digest (not the debug key)"
