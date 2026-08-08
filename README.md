# NotifFilter

Android notification filter. Intercepts notifications before they're shown, matches them against user-defined regex rules, and cancels the ones that shouldn't get through. All on-device, no network.

## How it works

A `NotificationListenerService` (system-bound, always running once enabled) captures every incoming notification. A Kotlin rule engine evaluates each one against user rules stored in SharedPreferences. Matched notifications are cancelled via `cancelNotification(key)`. Both shown and blocked notifications are logged to a unified History feed.

The UI is React Native (Expo SDK 57) — rule management only. The heavy lifting is native.

## Quick start

```bash
pnpm install
pnpm expo run:android          # dev build (required — custom native code)
```

Expo Go won't work. This app requires a development build because it ships a custom Kotlin service.

## Architecture

```
┌──────────────────────────┐
│  React Native (Expo 57)  │  ← rule UI, history, settings
├──────────────────────────┤
│  Expo Module (Kotlin)    │  ← bridge: JS ↔ native
├──────────────────────────┤
│  NotificationListenerSvc │  ← system-bound, always running
│  ├─ RuleEngine            │  ← evaluate regex + scope
│  ├─ RuleStore             │  ← SharedPreferences (rules)
│  └─ HistoryStore          │  ← SQLite (notification log)
└──────────────────────────┘
```

Key decisions:

- Filtering is native (Kotlin), not JS — must work when the app process is killed
- Rules live in `SharedPreferences` (single source of truth, read by both JS and the service)
- History in SQLite (written by service, read by JS via Expo Module)
- No MMKV, no AsyncStorage drift — the native store is authoritative

## Stack

| Concern      | Choice                           | Version |
| ------------ | -------------------------------- | ------- |
| Runtime      | Expo SDK 57                      | 57.0.x  |
| React Native | 0.86.x (New Arch only)           | 0.86.x  |
| Navigation   | expo-router (tabs)               | 57.x    |
| Styling      | NativeWind 4 + Tailwind 3.4      | 4.2.x   |
| State        | zustand                          | 5.x     |
| Icons        | Phosphor (phosphor-react-native) | 3.x     |
| Android      | targetSdk 36, minSdk 26          |         |

## Project structure

```
src/
  app/
    _layout.tsx          root layout (theme, nav provider)
    (tabs)/
      _layout.tsx        tab bar (Rules · History · Settings)
      index.tsx          Rules screen
      history.tsx        History screen
      settings.tsx       Settings screen
    rule/
      new.tsx            Rule editor (placeholder)
      [id].tsx           Edit rule (placeholder — to be created in M3)
  stores/
    rules.ts             zustand rules store
    settings.ts          zustand settings store
  global.css             Tailwind entry point
modules/
  notif-filter/          Expo Module (Kotlin) — M1
    android/src/main/java/.../
```

## Milestones

| #   | Phase                                   | Status  | GitHub                                                      |
| --- | --------------------------------------- | ------- | ----------------------------------------------------------- |
| M0  | Scaffold                                | ✅ Done | —                                                           |
| M1  | Native core + permission flow           | 🔲      | [#1](https://github.com/PinetheApple/notif-filter/issues/1) |
| M2  | Rule engine + RuleStore + app inventory | 🔲      | [#3](https://github.com/PinetheApple/notif-filter/issues/3) |
| M3  | Rules UI: editor, picker, regex test    | 🔲      | [#2](https://github.com/PinetheApple/notif-filter/issues/2) |
| M4  | History: SQLite log, restore            | 🔲      | [#4](https://github.com/PinetheApple/notif-filter/issues/4) |
| M5  | Polish: onboarding, anti-slop, e2e, APK | 🔲      | [#6](https://github.com/PinetheApple/notif-filter/issues/6) |

Work through them in order. Each milestone has full acceptance criteria in the issue body.

Full plan: [PLAN.md](PLAN.md)

## Design decisions

- Zinc+amber palette, no purple/indigo, no gradients, no glassmorphism
- Phosphor icons, regular weight only
- System font, 4/8 spacing scale, one radius scale
- dark: variant on every surface, body text >= 4.5:1
- No hype copy, no emoji, no exclamation marks in UI strings

## Design preview

Open `design-preview.html` in a browser. Press `d` to toggle dark mode.

## Notes for the next agent

1. Read AGENTS.md for working instructions
2. Check the current milestone's GitHub issue for full context
3. Run `pnpm exec tsc --noEmit` after changes — clean build enforced
4. Read PLAN.md sections relevant to the milestone before starting
5. The app does not use Expo Go — always `pnpm expo run:android`
6. All native code goes under `modules/notif-filter/`
