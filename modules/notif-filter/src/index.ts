import { requireNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

const NativeModule = requireNativeModule<{
  isListenerEnabled(): boolean;
  openNotificationAccessSettings(): void;
  postTestNotification(title: string, text: string): void;
  getRules(): string;
  saveRules(json: string): void;
  getSettings(): string;
  saveSettings(json: string): void;
  listInstalledApps(): { package: string; label: string; hasPosted: boolean }[];
  getAppIcon(packageName: string): string;
  getSeenPackages(): string[];
  testPattern(
    pattern: string,
    caseInsensitive: boolean,
    title: string,
    text: string,
  ): { matches: boolean; matchedSegment: string };
  getHistoryEntries(limit: number, beforeTs?: number): string;
  clearHistory(): void;
  restoreEntry(id: string): void;
  addListener(
    eventName: string,
    listener: (event: { connected: boolean }) => void,
  ): EventSubscription;
  removeListener(eventName: string, listener: (event: { connected: boolean }) => void): void;
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

// The expanded-view fields are optional: rows written before the schema bump carry
// none of them, and the UI must still render those.
export type HistoryEntry = {
  id: string;
  package: string;
  appLabel: string;
  title: string;
  text: string;
  subText?: string;
  bigText?: string;
  summaryText?: string;
  infoText?: string;
  textLines?: string;
  disposition: 'shown' | 'blocked';
  ruleId: string | null;
  ruleLabel: string | null;
  matchedSegment: string | null;
  /** StatusBarNotification.key the row's identity is derived from. */
  notifKey?: string;
  /** True when the row was backfilled on listener reconnect, not seen live. */
  recovered?: boolean;
  timestamp: number;
  postTime: number;
};

export function getHistoryEntries(limit: number, beforeTs?: number): HistoryEntry[] {
  const json = NativeModule.getHistoryEntries(limit, beforeTs);
  return JSON.parse(json);
}

export function clearHistory(): void {
  NativeModule.clearHistory();
}

export function restoreEntry(id: string): void {
  NativeModule.restoreEntry(id);
}
