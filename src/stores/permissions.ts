import { create } from 'zustand';
import { requireNativeModule } from 'expo-modules-core';

type PermissionState = {
  listenerEnabled: boolean | null;
  setListenerEnabled: (v: boolean) => void;
  checkPermission: () => Promise<void>;
};

const NotifFilter = requireNativeModule<{
  isListenerEnabled(): boolean;
}>('NotifFilter');

export const usePermissionStore = create<PermissionState>((set) => ({
  listenerEnabled: null,
  setListenerEnabled: (listenerEnabled) => set({ listenerEnabled }),
  checkPermission: async () => {
    try {
      const enabled = NotifFilter.isListenerEnabled();
      set({ listenerEnabled: enabled });
    } catch {
      set({ listenerEnabled: false });
    }
  },
}));
