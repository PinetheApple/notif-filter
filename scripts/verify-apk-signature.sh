#!/usr/bin/env bash
# Fails when the APK is unsigned or signed with the template debug key. The first key
# published is locked in forever, so a debug-signed release must never leave CI.
set -euo pipefail

EXIT_DEBUG_KEY=1
EXIT_CANNOT_CHECK=2
RAW_EXCERPT_LINES=40

# apksigner labels the first signer either bare or with an SDK-range prefix depending on
# the build-tools version; both must parse, and neither may match signer #2 or SHA-1.
SIGNER_1_SHA256_LINE='^Signer( \(minSdkVersion=[0-9]+(, maxSdkVersion=[0-9]+)?\))? #1 certificate SHA-256 digest:[[:space:]]+[0-9A-Fa-f:]+$'
COLONED_SHA256='[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){31}'
NORMALISED_SHA256='^[0-9a-f]{64}$'

if [ "$#" -ne 2 ]; then
  echo "usage: verify-apk-signature.sh <apk> <debug-keystore>" >&2
  exit "$EXIT_CANNOT_CHECK"
fi

APK="$1"
DEBUG_KEYSTORE="$2"
DEBUG_KEYSTORE_PASSWORD="android"
DEBUG_KEY_ALIAS="androiddebugkey"

fail_cannot_check() {
  local message="$1"
  local raw="$2"

  echo "verify-apk-signature: $message" >&2
  echo "--- raw output (first $RAW_EXCERPT_LINES lines) ---" >&2
  printf '%s\n' "$raw" | head -n "$RAW_EXCERPT_LINES" >&2
  echo "--- end raw output ---" >&2
  exit "$EXIT_CANNOT_CHECK"
}

normalise_digest() {
  tr -d ':' | tr '[:upper:]' '[:lower:]'
}

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "verify-apk-signature: ANDROID_HOME is not set" >&2
  exit "$EXIT_CANNOT_CHECK"
fi

APKSIGNER="$(find "$ANDROID_HOME/build-tools" -maxdepth 2 -name apksigner -type f | sort -V | tail -n 1)"
if [ -z "$APKSIGNER" ]; then
  echo "verify-apk-signature: apksigner not found under $ANDROID_HOME/build-tools" >&2
  exit "$EXIT_CANNOT_CHECK"
fi

if ! verify_output="$("$APKSIGNER" verify --verbose "$APK" 2>&1)"; then
  fail_cannot_check "apksigner could not verify $APK" "$verify_output"
fi
printf '%s\n' "$verify_output"

if ! certs_output="$("$APKSIGNER" verify --print-certs "$APK" 2>&1)"; then
  fail_cannot_check "apksigner could not print certificates for $APK" "$certs_output"
fi

if ! apk_digest="$(
  printf '%s\n' "$certs_output" |
    grep -E -m 1 "$SIGNER_1_SHA256_LINE" |
    awk '{ print $NF }' |
    normalise_digest
)"; then
  apk_digest=""
fi

if ! [[ "$apk_digest" =~ $NORMALISED_SHA256 ]]; then
  fail_cannot_check "no signer #1 SHA-256 digest in apksigner --print-certs output" "$certs_output"
fi

if ! keytool_output="$(
  keytool -list -keystore "$DEBUG_KEYSTORE" \
    -storepass "$DEBUG_KEYSTORE_PASSWORD" \
    -alias "$DEBUG_KEY_ALIAS" 2>&1
)"; then
  fail_cannot_check "keytool could not read $DEBUG_KEYSTORE" "$keytool_output"
fi

if ! debug_digest="$(
  printf '%s\n' "$keytool_output" |
    grep -E -m 1 -o "$COLONED_SHA256" |
    normalise_digest
)"; then
  debug_digest=""
fi

if ! [[ "$debug_digest" =~ $NORMALISED_SHA256 ]]; then
  fail_cannot_check "no SHA-256 fingerprint in keytool output for $DEBUG_KEYSTORE" "$keytool_output"
fi

if [ "$apk_digest" = "$debug_digest" ]; then
  echo "verify-apk-signature: APK is signed with the debug key ($apk_digest)" >&2
  exit "$EXIT_DEBUG_KEY"
fi

echo "verify-apk-signature: APK signer SHA-256: $apk_digest (not the debug key)"
