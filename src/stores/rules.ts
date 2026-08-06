import { create } from "zustand";
import * as NotifFilter from "../../modules/notif-filter/src/index";

export type RuleAction = "allow" | "deny";

export type Rule = {
  id: string;
  label: string;
  enabled: boolean;
  scopeKind: "all" | "packages";
  scopePackages: string[];
  pattern: string;
  caseInsensitive: boolean;
  field: "title" | "text" | "any";
  action: RuleAction;
  updatedAt: number;
};

type RulesState = {
  rules: Rule[];
  loaded: boolean;
  loadFromNative: () => void;
  addRule: (r: Rule) => void;
  updateRule: (id: string, patch: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  reorderRules: (ids: string[]) => void;
  toggleRule: (id: string) => void;
  importRules: (imported: Rule[], mode: "merge" | "replace") => void;
};

function persist(rules: Rule[]): void {
  NotifFilter.saveRules(JSON.stringify(rules));
}

export const useRulesStore = create<RulesState>((set) => ({
  rules: [],
  loaded: false,

  loadFromNative: () => {
    try {
      const json = NotifFilter.getRules();
      const rules: Rule[] = JSON.parse(json);
      set({ rules, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addRule: (rule) =>
    set((s) => {
      const rules = [...s.rules, rule];
      persist(rules);
      return { rules };
    }),

  updateRule: (id, patch) =>
    set((s) => {
      const rules = s.rules.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
      );
      persist(rules);
      return { rules };
    }),

  removeRule: (id) =>
    set((s) => {
      const rules = s.rules.filter((r) => r.id !== id);
      persist(rules);
      return { rules };
    }),

  reorderRules: (ids) =>
    set((s) => {
      const rules = ids
        .map((id) => s.rules.find((r) => r.id === id))
        .filter((r): r is Rule => !!r);
      persist(rules);
      return { rules };
    }),

  toggleRule: (id) =>
    set((s) => {
      const rules = s.rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r,
      );
      persist(rules);
      return { rules };
    }),

  importRules: (imported, mode) =>
    set((s) => {
      if (mode === "replace") {
        persist(imported);
        return { rules: imported };
      }
      // Merge: skip duplicates by id, append new ones
      const existingIds = new Set(s.rules.map((r) => r.id));
      const merged = [
        ...s.rules,
        ...imported.filter((r) => !existingIds.has(r.id)),
      ];
      persist(merged);
      return { rules: merged };
    }),
}));
