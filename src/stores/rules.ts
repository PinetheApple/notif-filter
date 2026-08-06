import { create } from 'zustand';

export type RuleAction = 'allow' | 'deny';

export type Rule = {
  id: string;
  label: string;
  enabled: boolean;
  scopeType: 'all' | 'packages';
  scopePackages: string[];
  pattern: string;
  caseInsensitive: boolean;
  field: 'title' | 'text' | 'any';
  action: RuleAction;
};

type RulesState = {
  rules: Rule[];
  addRule: (r: Rule) => void;
  updateRule: (id: string, patch: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  reorderRules: (ids: string[]) => void;
  toggleRule: (id: string) => void;
};

export const useRulesStore = create<RulesState>((set) => ({
  rules: [],
  addRule: (rule) => set((s) => ({ rules: [...s.rules, rule] })),
  updateRule: (id, patch) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  removeRule: (id) =>
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
  reorderRules: (ids) =>
    set((s) => ({
      rules: ids
        .map((id) => s.rules.find((r) => r.id === id))
        .filter((r): r is Rule => !!r),
    })),
  toggleRule: (id) =>
    set((s) => ({
      rules: s.rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r,
      ),
    })),
}));
