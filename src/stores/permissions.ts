import { create } from 'zustand';
import { PermissionsAndroid, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// Below Android 13 POST_NOTIFICATIONS is granted at install time, so there is
// nothing to request and NotificationManager.notify always works.
const ANDROID_13 = 33;

type PermissionState = {
  listenerEnabled: boolean | null;
  postNotificationsGranted: boolean | null;
  setListenerEnabled: (v: boolean) => void;
  checkPermission: () => Promise<void>;
  requestPostNotifications: () => Promise<boolean>;
};

const NotifFilter = requireNativeModule<{
  isListenerEnabled(): boolean;
}>('NotifFilter');

export const usePermissionStore = create<PermissionState>((set) => ({
  listenerEnabled: null,
  postNotificationsGranted: null,
  setListenerEnabled: (listenerEnabled) => set({ listenerEnabled }),
  checkPermission: async () => {
    try {
      const enabled = NotifFilter.isListenerEnabled();
      set({ listenerEnabled: enabled });
    } catch {
      set({ listenerEnabled: false });
    }
  },
  requestPostNotifications: async () => {
    if (Platform.OS !== 'android' || Number(Platform.Version) < ANDROID_13) {
      set({ postNotificationsGranted: true });
      return true;
    }

    try {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      const granted = status === PermissionsAndroid.RESULTS.GRANTED;
      set({ postNotificationsGranted: granted });
      return granted;
    } catch {
      set({ postNotificationsGranted: false });
      return false;
    }
  },
}));
