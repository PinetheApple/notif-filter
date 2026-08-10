#!/usr/bin/env bash
# Regression tests for verify-apk-signature.sh. apksigner's --print-certs format varies
# with build-tools version and with which signature schemes the APK carries, and each
# variant we failed to parse cost a release, so every known shape is pinned here.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNDER_TEST="$SCRIPT_DIR/verify-apk-signature.sh"

DEBUG_KEYSTORE_PASSWORD="android"
DEBUG_KEY_ALIAS="androiddebugkey"
STUB_BUILD_TOOLS_VERSION="36.0.0"
OTHER_DIGEST="2a70a92195df8b97b8de38aa85b7d37350e7577ab0b125bcd7f85bc54ce2eff1"
SECOND_SIGNER_DIGEST="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SHA1_DIGEST="d39cde93c0e1695c50a2e6110e7c5c3024ed5d35"
MD5_DIGEST="8826f2031856d27025b6c9d717883365"
COLONED_SHA256='[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){31}'

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

failures=0

# The stub reads FAKE_CASE and FAKE_DIGEST rather than an APK, so these tests need no
# Android SDK and no signing key.
setup_stub_apksigner() {
  local stub_dir="$WORK_DIR/sdk/build-tools/$STUB_BUILD_TOOLS_VERSION"
  mkdir -p "$stub_dir"
  cat > "$stub_dir/apksigner" <<'STUB'
#!/usr/bin/env bash
mode="$2"

emit_verify() {
  echo "Verifies"
  echo "Verified using v1 scheme (JAR signing): $1"
  echo "Verified using v2 scheme (APK Signature Scheme v2): true"
  echo "Number of signers: $2"
}

case "$FAKE_CASE" in
  jar_numbered)
    if [ "$mode" = "--print-certs" ]; then
      echo "Signer #1 certificate SHA-1 digest: $SHA1_DIGEST"
      echo "Signer #1 certificate SHA-256 digest: $FAKE_DIGEST"
    else
      emit_verify true 1
    fi
    ;;
  jar_sdk_range)
    if [ "$mode" = "--print-certs" ]; then
      echo "Signer (minSdkVersion=26, maxSdkVersion=2147483647) #1 certificate SHA-256 digest: $FAKE_DIGEST"
      echo "Signer (minSdkVersion=26, maxSdkVersion=2147483647) #1 certificate SHA-1 digest: $SHA1_DIGEST"
    else
      emit_verify true 1
    fi
    ;;
  v2_only)
    # The shape a v2-only release APK actually produces: no signer number at all.
    if [ "$mode" = "--print-certs" ]; then
      echo "V2 Signer: certificate DN: CN=placeholder, OU=placeholder, O=placeholder"
      echo "V2 Signer: certificate SHA-256 digest: $FAKE_DIGEST"
      echo "V2 Signer: certificate SHA-1 digest: $SHA1_DIGEST"
      echo "V2 Signer: certificate MD5 digest: $MD5_DIGEST"
    else
      emit_verify false 1
    fi
    ;;
  v2_and_v3_same_cert)
    if [ "$mode" = "--print-certs" ]; then
      echo "V2 Signer: certificate SHA-256 digest: $FAKE_DIGEST"
      echo "V3 Signer: certificate SHA-256 digest: $FAKE_DIGEST"
    else
      emit_verify false 1
    fi
    ;;
  two_signers)
    if [ "$mode" = "--print-certs" ]; then
      echo "Signer #1 certificate SHA-256 digest: $FAKE_DIGEST"
      echo "Signer #2 certificate SHA-256 digest: $SECOND_SIGNER_DIGEST"
    else
      emit_verify true 2
    fi
    ;;
  scheme_labelled_two_certs)
    if [ "$mode" = "--print-certs" ]; then
      echo "V2 Signer: certificate SHA-256 digest: $FAKE_DIGEST"
      echo "V3 Signer: certificate SHA-256 digest: $SECOND_SIGNER_DIGEST"
    else
      emit_verify false 1
    fi
    ;;
  sha1_only)
    if [ "$mode" = "--print-certs" ]; then
      echo "V2 Signer: certificate SHA-1 digest: $SHA1_DIGEST"
      echo "V2 Signer: certificate MD5 digest: $MD5_DIGEST"
    else
      emit_verify false 1
    fi
    ;;
  no_digest)
    if [ "$mode" = "--print-certs" ]; then
      echo "unexpected apksigner chatter with no digest at all"
    else
      emit_verify false 1
    fi
    ;;
  verify_fails)
    echo "DOES NOT VERIFY" >&2
    echo "ERROR: Missing META-INF/MANIFEST.MF" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$stub_dir/apksigner"
}

# A throwaway keystore standing in for android/app/debug.keystore, which is gitignored.
setup_debug_keystore() {
  keytool -genkeypair -storetype PKCS12 \
    -keystore "$WORK_DIR/debug.keystore" \
    -storepass "$DEBUG_KEYSTORE_PASSWORD" \
    -alias "$DEBUG_KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 1 -dname "CN=placeholder" > /dev/null 2>&1

  keytool -list -keystore "$WORK_DIR/debug.keystore" \
    -storepass "$DEBUG_KEYSTORE_PASSWORD" -alias "$DEBUG_KEY_ALIAS" |
    grep -m 1 -oE "$COLONED_SHA256" |
    tr -d ':' |
    tr '[:upper:]' '[:lower:]'
}

expect() {
  local name="$1"
  local fake_case="$2"
  local fake_digest="$3"
  local want_exit="$4"
  local want_text="$5"

  local output status
  set +e
  output="$(
    ANDROID_HOME="$WORK_DIR/sdk" \
      FAKE_CASE="$fake_case" \
      FAKE_DIGEST="$fake_digest" \
      SHA1_DIGEST="$SHA1_DIGEST" \
      MD5_DIGEST="$MD5_DIGEST" \
      SECOND_SIGNER_DIGEST="$SECOND_SIGNER_DIGEST" \
      "$UNDER_TEST" unused.apk "$WORK_DIR/debug.keystore" 2>&1
  )"
  status=$?
  set -e

  if [ "$status" -ne "$want_exit" ]; then
    echo "FAIL $name: expected exit $want_exit, got $status"
    printf '%s\n' "$output" | sed 's/^/      /'
    failures=$((failures + 1))
    return
  fi

  if ! printf '%s\n' "$output" | grep -qF "$want_text"; then
    echo "FAIL $name: output did not contain '$want_text'"
    printf '%s\n' "$output" | sed 's/^/      /'
    failures=$((failures + 1))
    return
  fi

  echo "ok   $name"
}

setup_stub_apksigner
debug_digest="$(setup_debug_keystore)"

expect "numbered signer, release key" jar_numbered "$OTHER_DIGEST" 0 "not the debug key"
expect "sdk-range prefix, release key" jar_sdk_range "$OTHER_DIGEST" 0 "not the debug key"
expect "v2-only scheme label, release key" v2_only "$OTHER_DIGEST" 0 "not the debug key"
expect "one cert across v2 and v3" v2_and_v3_same_cert "$OTHER_DIGEST" 0 "not the debug key"

expect "numbered signer, debug key" jar_numbered "$debug_digest" 1 "signed with the debug key"
expect "v2-only scheme label, debug key" v2_only "$debug_digest" 1 "signed with the debug key"

expect "two signers" two_signers "$OTHER_DIGEST" 2 "expected 1 signer"
expect "two certs, one signer" scheme_labelled_two_certs "$OTHER_DIGEST" 2 "more than one distinct"
expect "sha-1 and md5 only" sha1_only "$OTHER_DIGEST" 2 "no signer SHA-256 digest"
expect "unparseable certs output" no_digest "$OTHER_DIGEST" 2 "no signer SHA-256 digest"
expect "apksigner cannot verify" verify_fails "$OTHER_DIGEST" 2 "could not verify"

if [ "$failures" -ne 0 ]; then
  echo "$failures test(s) failed"
  exit 1
fi

echo "all tests passed"
