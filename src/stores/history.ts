import { create } from 'zustand';
import * as NotifFilter from '../../modules/notif-filter/src/index';
import type { HistoryEntry } from '../../modules/notif-filter/src/index';

const PAGE_SIZE = 30;

export type DispositionFilter = 'all' | 'shown' | 'blocked';

export type HistoryFilters = {
  query: string;
  packages: string[];
  disposition: DispositionFilter;
  ascending: boolean;
};

export const DEFAULT_FILTERS: HistoryFilters = {
  query: '',
  packages: [],
  disposition: 'all',
  ascending: false,
};

type HistoryState = {
  entries: HistoryEntry[];
  hasMore: boolean;
  loaded: boolean;
  filters: HistoryFilters;
  loadPage: (beforeTs?: number) => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: HistoryFilters) => Promise<void>;
  clearAll: () => void;
  restoreEntry: (id: string) => Promise<void>;
};

function fetchEntries(filters: HistoryFilters, limit: number, beforeTs?: number): HistoryEntry[] {
  return NotifFilter.getHistoryEntries(
    limit,
    beforeTs,
    filters.query.trim() || undefined,
    filters.packages.length > 0 ? filters.packages : undefined,
    filters.disposition === 'all' ? undefined : filters.disposition,
    filters.ascending,
  );
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  hasMore: true,
  loaded: false,
  filters: DEFAULT_FILTERS,

  loadPage: async (beforeTs?: number) => {
    const entries = fetchEntries(get().filters, PAGE_SIZE + 1, beforeTs);
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
    const entries = fetchEntries(get().filters, depth + 1);
    const hasMore = entries.length > depth;
    set({
      entries: hasMore ? entries.slice(0, depth) : entries,
      hasMore,
      loaded: true,
    });
  },

  setFilters: async (filters) => {
    set({ filters, entries: [], hasMore: true });
    await get().loadPage();
  },

  clearAll: () => {
    NotifFilter.clearHistory();
    set({ entries: [], hasMore: false, loaded: true });
  },

  restoreEntry: async (id: string) => {
    NotifFilter.restoreEntry(id);
  },
}));
