import { create } from "zustand";
import * as NotifFilter from "../../modules/notif-filter/src/index";

type ThemePreference = "system" | "light" | "dark";
type DefaultPolicy = "allow" | "block";

type SettingsState = {
  defaultPolicy: DefaultPolicy;
  setDefaultPolicy: (p: DefaultPolicy) => void;
  filterOngoing: boolean;
  setFilterOngoing: (v: boolean) => void;
  logSize: number;
  setLogSize: (n: number) => void;
  themePreference: ThemePreference;
  setThemePreference: (t: ThemePreference) => void;
  loaded: boolean;
  loadFromNative: () => void;
};

function persist(
  s: Pick<
    SettingsState,
    "defaultPolicy" | "filterOngoing" | "logSize" | "themePreference"
  >,
): void {
  NotifFilter.saveSettings(
    JSON.stringify({
      defaultPolicy: s.defaultPolicy,
      filterOngoing: s.filterOngoing,
      logSize: s.logSize,
      theme: s.themePreference,
    }),
  );
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultPolicy: "allow",
  setDefaultPolicy: (defaultPolicy) => {
    set((s) => {
      persist({ ...s, defaultPolicy });
      return { defaultPolicy };
    });
  },
  filterOngoing: false,
  setFilterOngoing: (filterOngoing) => {
    set((s) => {
      persist({ ...s, filterOngoing });
      return { filterOngoing };
    });
  },
  logSize: 500,
  setLogSize: (logSize) => {
    set((s) => {
      persist({ ...s, logSize });
      return { logSize };
    });
  },
  themePreference: "system",
  setThemePreference: (themePreference) => {
    set((s) => {
      persist({ ...s, themePreference });
      return { themePreference };
    });
  },
  loaded: false,
  loadFromNative: () => {
    try {
      const json = NotifFilter.getSettings();
      const data = JSON.parse(json);
      set({
        defaultPolicy: data.defaultPolicy ?? "allow",
        filterOngoing: data.filterOngoing ?? false,
        logSize: data.logSize ?? 500,
        themePreference: data.theme ?? "system",
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
