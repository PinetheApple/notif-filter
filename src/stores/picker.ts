import { create } from 'zustand';

/** Which screen the current picker session belongs to. */
export const PICKER_PURPOSE = {
  ruleScope: 'ruleScope',
  ignoredApps: 'ignoredApps',
  historyFilter: 'historyFilter',
} as const;

export type PickerPurpose = (typeof PICKER_PURPOSE)[keyof typeof PICKER_PURPOSE];

type PickerState = {
  purpose: PickerPurpose;
  selected: string[];
  open: (purpose: PickerPurpose, initial: string[]) => void;
  setSelected: (packages: string[]) => void;
  togglePackage: (pkg: string) => void;
};

export const usePickerStore = create<PickerState>((set) => ({
  purpose: PICKER_PURPOSE.ruleScope,
  selected: [],
  // Purpose and selection are set together so a session started from settings
  // cannot be read back as a rule's app scope.
  open: (purpose, selected) => set({ purpose, selected }),
  setSelected: (selected) => set({ selected }),
  togglePackage: (pkg) =>
    set((s) => {
      if (s.selected.includes(pkg)) {
        return { selected: s.selected.filter((p) => p !== pkg) };
      }
      return { selected: [...s.selected, pkg] };
    }),
}));

export function sameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((pkg, i) => pkg === b[i]);
}
