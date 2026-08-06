# AGENTS.md — NotifFilter

## Project

Android notification filter app. React Native (Expo SDK 57) UI on top of a Kotlin
NotificationListenerService that intercepts and cancels notifications before they
reach the user. All matching is native (Java regex in Kotlin), not JS.

## Before any code

- Read the current milestone's GitHub issue for the full spec + acceptance criteria
- Read the relevant sections of PLAN.md
- `npx tsc --noEmit` must pass before committing
- This app requires a dev build (`npx expo run:android`), not Expo Go

## Code style

- No magic values — extract constants
- Files <= 400-500 lines; split when you hit the threshold
- Comments: only "why" comments, max 2 lines each. Docstrings exempt
- JSX: no inline arrow functions in event props; extract to named handlers
- Function parameters: one per line when they exceed ~3 params, closing paren on its own line
- Braces: use braces only for multi-line function bodies (one-liners go without)

## Theme

- Colors: `bg-surface-*`, `text-surface-dark`, `text-muted`, `bg-accent`, `text-accent-text`
  defined in `tailwind.config.ts`
- Dark mode: use `dark:` prefix on every color/background class
- Icons: `phosphor-react-native`, only use `weight="regular"` (bold reserved for tab bar active state)
- Copy: functional, no hype words, no emoji

## Architecture constraints

- The native store (SharedPreferences for rules, SQLite for history) is the
  single source of truth. JS reads/writes through Expo Module methods
- Do not add MMKV, AsyncStorage, or any JS-side persistence for rules/settings
- Kotlin code lives in `modules/notif-filter/android/src/main/java/...`
- JVM unit tests go in `modules/notif-filter/android/src/test/java/...`
- Target SDK: 36 (Android 16). Min SDK: 26

## Milestone order

Work sequentially: M0 → M1 → M2 → M3 → M4 → M5.
Each builds on the previous. Do not skip ahead.
