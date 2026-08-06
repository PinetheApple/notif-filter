import { create } from 'zustand';

type ThemePreference = 'system' | 'light' | 'dark';
type DefaultPolicy = 'allow' | 'block';

type SettingsState = {
  defaultPolicy: DefaultPolicy;
  setDefaultPolicy: (p: DefaultPolicy) => void;
  filterOngoing: boolean;
  setFilterOngoing: (v: boolean) => void;
  logSize: number;
  setLogSize: (n: number) => void;
  themePreference: ThemePreference;
  setThemePreference: (t: ThemePreference) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultPolicy: 'allow',
  setDefaultPolicy: (defaultPolicy) => set({ defaultPolicy }),
  filterOngoing: false,
  setFilterOngoing: (filterOngoing) => set({ filterOngoing }),
  logSize: 500,
  setLogSize: (logSize) => set({ logSize }),
  themePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
}));
