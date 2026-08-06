import { requireNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

const NativeModule = requireNativeModule<{
  isListenerEnabled(): boolean;
  openNotificationAccessSettings(): void;
  postTestNotification(title: string, text: string): void;

  // M2: rules & settings
  getRules(): string;
  saveRules(json: string): void;
  getSettings(): string;
  saveSettings(json: string): void;

  // M2: app inventory
  listInstalledApps(): { package: string; label: string; hasPosted: boolean }[];
  getAppIcon(packageName: string): string;
  getSeenPackages(): string[];

  // M2: pattern tester
  testPattern(
    pattern: string,
    caseInsensitive: boolean,
    title: string,
    text: string,
  ): { matches: boolean; matchedSegment: string };

  addListener(
    eventName: string,
    listener: (event: { connected: boolean }) => void,
  ): EventSubscription;
  removeListener(
    eventName: string,
    listener: (event: { connected: boolean }) => void,
  ): void;
}>('NotifFilter');

export function isListenerEnabled(): boolean {
  return NativeModule.isListenerEnabled();
}

export function openNotificationAccessSettings(): void {
  NativeModule.openNotificationAccessSettings();
}

export function postTestNotification(title: string, text: string): void {
  NativeModule.postTestNotification(title, text);
}

export function addListenerConnectionListener(
  listener: (event: { connected: boolean }) => void,
): EventSubscription {
  return NativeModule.addListener('onListenerConnectionChanged', listener);
}

export function removeListenerConnectionListener(
  listener: (event: { connected: boolean }) => void,
): void {
  NativeModule.removeListener('onListenerConnectionChanged', listener);
}

// ── M2: Rules & settings ──────────────────────────────────────────────────────

export function getRules(): string {
  return NativeModule.getRules();
}

export function saveRules(json: string): void {
  NativeModule.saveRules(json);
}

export function getSettings(): string {
  return NativeModule.getSettings();
}

export function saveSettings(json: string): void {
  NativeModule.saveSettings(json);
}

// ── M2: App inventory ─────────────────────────────────────────────────────────

export type InstalledApp = {
  package: string;
  label: string;
  hasPosted: boolean;
};

export function listInstalledApps(): InstalledApp[] {
  return NativeModule.listInstalledApps();
}

export function getAppIcon(packageName: string): string {
  return NativeModule.getAppIcon(packageName);
}

export function getSeenPackages(): string[] {
  return NativeModule.getSeenPackages();
}

// ── M2: Pattern tester ────────────────────────────────────────────────────────

export type TestPatternResult = {
  matches: boolean;
  matchedSegment: string;
};

export function testPattern(
  pattern: string,
  caseInsensitive: boolean,
  title: string,
  text: string,
): TestPatternResult {
  return NativeModule.testPattern(pattern, caseInsensitive, title, text);
}
