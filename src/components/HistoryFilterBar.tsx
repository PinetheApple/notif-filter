import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MagnifyingGlass, X, Funnel, ArrowsDownUp } from 'phosphor-react-native';

import { SegmentedControl } from '@/components/ui';
import { palette } from '@/constants/colors';
import type { DispositionFilter, HistoryFilters } from '@/stores/history';

const ICON_SIZE = 16;
const QUERY_DEBOUNCE_MS = 250;
const DISPOSITIONS = ['all', 'blocked', 'shown'] as const;

const DISPOSITION_LABELS: Record<DispositionFilter, string> = {
  all: 'All',
  blocked: 'Blocked',
  shown: 'Shown',
};

function formatDisposition(option: DispositionFilter): string {
  return DISPOSITION_LABELS[option];
}

type Props = {
  filters: HistoryFilters;
  scheme: 'light' | 'dark';
  onChange: (filters: HistoryFilters) => void;
  onOpenAppPicker: () => void;
};

export function HistoryFilterBar({ filters, scheme, onChange, onOpenAppPicker }: Props) {
  const p = palette(scheme);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  const [appliedQuery, setAppliedQuery] = useState(filters.query);

  // Clearing the filters resets the query behind this field's back, so the draft
  // follows an applied value it did not produce. Adjusting during render rather
  // than in an effect avoids rendering the stale text for a frame.
  if (appliedQuery !== filters.query) {
    setAppliedQuery(filters.query);
    setDraftQuery(filters.query);
  }

  // Every committed query is a database round-trip, so typing settles first.
  useEffect(() => {
    if (draftQuery === filters.query) return;
    const timer = setTimeout(() => {
      onChange({ ...filters, query: draftQuery });
    }, QUERY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draftQuery, filters, onChange]);

  function handleClearQuery() {
    setDraftQuery('');
  }

  function handleDispositionChange(disposition: DispositionFilter) {
    onChange({ ...filters, disposition });
  }

  function handleToggleOrder() {
    onChange({ ...filters, ascending: !filters.ascending });
  }

  const appLabel = filters.packages.length > 0 ? `Apps (${filters.packages.length})` : 'Apps';
  const appsActive = filters.packages.length > 0;

  return (
    <View className="gap-2 px-4 pb-2">
      <View className="flex-row items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2 dark:bg-surface-dark-secondary">
        <MagnifyingGlass size={ICON_SIZE} weight="regular" color={p.muted} />
        <TextInput
          value={draftQuery}
          onChangeText={setDraftQuery}
          placeholder="Search notifications..."
          placeholderTextColor={p.muted}
          className="flex-1 text-sm text-surface-dark dark:text-white"
        />
        {draftQuery.length > 0 ? (
          <Pressable onPress={handleClearQuery} hitSlop={8}>
            <X size={ICON_SIZE} weight="regular" color={p.muted} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        <SegmentedControl
          options={DISPOSITIONS}
          value={filters.disposition}
          onChange={handleDispositionChange}
          formatLabel={formatDisposition}
          size="sm"
        />

        <Pressable
          onPress={onOpenAppPicker}
          className={`flex-row items-center gap-1 rounded-lg px-3 py-1.5 ${
            appsActive
              ? 'bg-accent dark:bg-accent-dark'
              : 'bg-surface-secondary dark:bg-surface-dark-secondary'
          }`}
        >
          <Funnel size={ICON_SIZE} weight="regular" color={appsActive ? p.accentText : p.muted} />
          <Text
            className={`text-xs font-medium ${
              appsActive
                ? 'text-accent-text dark:text-accent-text-dark'
                : 'text-surface-dark dark:text-white'
            }`}
          >
            {appLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleToggleOrder}
          className="flex-row items-center gap-1 rounded-lg bg-surface-secondary px-3 py-1.5 dark:bg-surface-dark-secondary"
        >
          <ArrowsDownUp size={ICON_SIZE} weight="regular" color={p.muted} />
          <Text className="text-xs font-medium text-surface-dark dark:text-white">
            {filters.ascending ? 'Oldest' : 'Newest'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
