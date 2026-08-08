import { create } from 'zustand';
import * as NotifFilter from '../../modules/notif-filter/src/index';
import type { HistoryEntry } from '../../modules/notif-filter/src/index';

const PAGE_SIZE = 30;

type HistoryState = {
  entries: HistoryEntry[];
  hasMore: boolean;
  loaded: boolean;
  loadPage: (beforeTs?: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearAll: () => void;
  restoreEntry: (id: string) => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  hasMore: true,
  loaded: false,

  loadPage: async (beforeTs?: number) => {
    const entries = NotifFilter.getHistoryEntries(PAGE_SIZE + 1, beforeTs);
    const hasMore = entries.length > PAGE_SIZE;
    const page = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

    set((s) => ({
      entries: beforeTs ? [...s.entries, ...page] : page,
      hasMore,
      loaded: true,
    }));
  },

  refresh: async () => {
    // Re-query the depth already scrolled to, otherwise a refresh collapses a
    // deep list back to one page and drops the user's scroll position.
    const depth = Math.max(PAGE_SIZE, get().entries.length);
    const entries = NotifFilter.getHistoryEntries(depth + 1);
    const hasMore = entries.length > depth;
    set({
      entries: hasMore ? entries.slice(0, depth) : entries,
      hasMore,
      loaded: true,
    });
  },

  clearAll: () => {
    NotifFilter.clearHistory();
    set({ entries: [], hasMore: false, loaded: true });
  },

  restoreEntry: async (id: string) => {
    NotifFilter.restoreEntry(id);
  },
}));
