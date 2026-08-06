import { requireNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

const NativeModule = requireNativeModule<{
  isListenerEnabled(): boolean;
  openNotificationAccessSettings(): void;
  postTestNotification(title: string, text: string): void;
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
