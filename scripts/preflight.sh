#!/usr/bin/env bash
# Runs every gate CI runs, so a red pipeline is caught before pushing rather than after
# merging. Auto-fixes what is mechanically fixable and reports what it changed.
set -uo pipefail

EXIT_FAILED=1
EXIT_USAGE=2

SKIP_ANDROID=0
FIX=1

usage() {
  cat >&2 <<'EOF'
usage: preflight.sh [--no-fix] [--skip-android]

Mirrors the CI workflow:
  JS                   expo install --check, typecheck, format:check, lint
  Release script tests scripts/verify-apk-signature.test.sh
  Android unit tests   prebuild + :notif-filter:testDebugUnitTest

  --no-fix        report problems without rewriting any file
  --skip-android  skip the Gradle job (the slow one, needs a JDK)
EOF
  exit "$EXIT_USAGE"
}

for arg in "$@"; do
  case "$arg" in
    --no-fix) FIX=0 ;;
    --skip-android) SKIP_ANDROID=1 ;;
    -h | --help) usage ;;
    *)
      echo "unknown option: $arg" >&2
      usage
      ;;
  esac
done

cd "$(dirname "$0")/.."

FAILED=()
FIXED=()

# Each gate is run to completion rather than failing fast, so one push shows every
# problem instead of revealing them one CI round trip at a time.
run_gate() {
  local name="$1"
  shift
  printf '\n\033[1m==> %s\033[0m\n' "$name"
  if "$@"; then
    return 0
  fi
  FAILED+=("$name")
  return 1
}

printf '\033[1mpreflight\033[0m — running the same gates as CI\n'

run_gate "expo install --check" pnpm exec expo install --check

run_gate "typecheck" pnpm run typecheck

# Formatting and lint are the two gates that can repair themselves. Try the check
# first so an already-clean tree is not rewritten, then fix and re-check.
if ! pnpm run format:check >/dev/null 2>&1; then
  if [ "$FIX" -eq 1 ]; then
    printf '\n\033[1m==> format (fixing)\033[0m\n'
    if pnpm run format >/dev/null 2>&1 && pnpm run format:check; then
      FIXED+=("formatting")
    else
      FAILED+=("format:check")
    fi
  else
    run_gate "format:check" pnpm run format:check
  fi
else
  printf '\n\033[1m==> format:check\033[0m\nAll matched files use Prettier code style!\n'
fi

if ! pnpm run lint >/dev/null 2>&1; then
  if [ "$FIX" -eq 1 ]; then
    printf '\n\033[1m==> lint (fixing)\033[0m\n'
    pnpm run lint -- --fix >/dev/null 2>&1
    if pnpm run lint; then
      FIXED+=("lint")
    else
      FAILED+=("lint")
    fi
  else
    run_gate "lint" pnpm run lint
  fi
else
  run_gate "lint" pnpm run lint
fi

run_gate "release script tests" ./scripts/verify-apk-signature.test.sh

if [ "$SKIP_ANDROID" -eq 0 ]; then
  # android/ is gitignored and regenerated, and settings.gradle autolinks through node,
  # so the project cannot be configured until prebuild has run.
  if run_gate "expo prebuild (android)" pnpm exec expo prebuild --platform android --no-install; then
    run_gate "android unit tests" sh -c 'cd android && ./gradlew :notif-filter:testDebugUnitTest'
  fi
else
  printf '\n\033[1m==> android unit tests\033[0m\nskipped (--skip-android)\n'
fi

printf '\n'
if [ "${#FIXED[@]}" -gt 0 ]; then
  printf '\033[33mauto-fixed:\033[0m %s\n' "${FIXED[*]}"
  printf 'Files were modified. Review and commit them, or CI will still fail.\n'
fi

if [ "${#FAILED[@]}" -gt 0 ]; then
  printf '\033[31mFAILED:\033[0m %s\n' "${FAILED[*]}"
  exit "$EXIT_FAILED"
fi

printf '\033[32mAll CI gates pass.\033[0m\n'
