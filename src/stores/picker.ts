import { create } from "zustand";

type PickerState = {
  selected: string[];
  setSelected: (packages: string[]) => void;
  togglePackage: (pkg: string) => void;
  clear: () => void;
};

export const usePickerStore = create<PickerState>((set) => ({
  selected: [],
  setSelected: (selected) => set({ selected }),
  togglePackage: (pkg) =>
    set((s) => {
      if (s.selected.includes(pkg)) {
        return { selected: s.selected.filter((p) => p !== pkg) };
      }
      return { selected: [...s.selected, pkg] };
    }),
  clear: () => set({ selected: [] }),
}));
