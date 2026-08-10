#!/usr/bin/env bash
# Fails when the APK is unsigned or signed with the template debug key. The first key
# published is locked in forever, so a debug-signed release must never leave CI.
set -euo pipefail

EXIT_DEBUG_KEY=1
EXIT_CANNOT_CHECK=2
RAW_EXCERPT_LINES=40
EXPECTED_SIGNER_COUNT=1

# apksigner labels certificates differently across build-tools versions: numbered,
# SDK-range prefixed, or scheme labelled ("V2 Signer:") when there is no JAR signature.
SIGNER_LABEL='(Signer( \(minSdkVersion=[0-9]+(, maxSdkVersion=[0-9]+)?\))? #[0-9]+|V[0-9]+(\.[0-9]+)? Signer:)'
SIGNER_SHA256_LINE="^${SIGNER_LABEL} certificate SHA-256 digest:[[:space:]]+[0-9A-Fa-f:]+\$"
SIGNER_COUNT_LINE='^Number of signers:[[:space:]]+[0-9]+$'
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

# The scheme-labelled form carries no signer number, so the digest line is only
# unambiguous once the APK is known to have exactly one signer.
if ! signer_count="$(
  printf '%s\n' "$verify_output" |
    grep -E -m 1 "$SIGNER_COUNT_LINE" |
    awk '{ print $NF }'
)"; then
  signer_count=""
fi

if [ "$signer_count" != "$EXPECTED_SIGNER_COUNT" ]; then
  fail_cannot_check \
    "expected $EXPECTED_SIGNER_COUNT signer, apksigner reported '${signer_count:-none}'" \
    "$verify_output"
fi

if ! certs_output="$("$APKSIGNER" verify --print-certs "$APK" 2>&1)"; then
  fail_cannot_check "apksigner could not print certificates for $APK" "$certs_output"
fi

if ! apk_digests="$(
  printf '%s\n' "$certs_output" |
    grep -E "$SIGNER_SHA256_LINE" |
    awk '{ print $NF }' |
    normalise_digest |
    sort -u
)"; then
  apk_digests=""
fi

if [ -z "$apk_digests" ]; then
  fail_cannot_check "no signer SHA-256 digest in apksigner --print-certs output" "$certs_output"
fi

# One signer can still print several digest lines (one per scheme); they must agree.
if [ "$(printf '%s\n' "$apk_digests" | wc -l)" -ne 1 ]; then
  fail_cannot_check "apksigner printed more than one distinct signer certificate" "$certs_output"
fi

apk_digest="$apk_digests"
if ! [[ "$apk_digest" =~ $NORMALISED_SHA256 ]]; then
  fail_cannot_check "signer SHA-256 digest is not a 32-byte hex value" "$certs_output"
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
