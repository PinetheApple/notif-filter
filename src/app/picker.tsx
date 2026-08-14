import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Switch,
  InteractionManager,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, MagnifyingGlass } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { usePickerStore } from '@/stores/picker';
import { EmptyState, LoadingState } from '@/components/ui';
import { AppPickerRow } from '@/components/AppPickerRow';
import { palette, COLORS } from '@/constants/colors';
import * as NotifFilter from '../../modules/notif-filter/src/index';
import type { InstalledApp } from '../../modules/notif-filter/src/index';

const SEARCH_ICON_SIZE = 16;
const BACK_ICON_SIZE = 22;

function keyExtractor(item: InstalledApp) {
  return item.package;
}

export default function AppPickerScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  const selected = usePickerStore((s) => s.selected);
  const togglePackage = usePickerStore((s) => s.togglePackage);
  const setSelected = usePickerStore((s) => s.setSelected);

  const [query, setQuery] = useState('');
  const [onlyNotifying, setOnlyNotifying] = useState(false);

  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [seenPackages, setSeenPackages] = useState<ReadonlySet<string>>(new Set());

  // Reading the package manager is a blocking bridge call; running it after the entry
  // animation lets the header and loading indicator paint instead of a frozen blank frame.
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setSeenPackages(new Set(NotifFilter.getSeenPackages()));
      setApps(NotifFilter.listInstalledApps());
    });
    return () => task.cancel();
  }, []);

  const filtered = useMemo(() => {
    let list = apps ?? [];
    if (onlyNotifying) {
      list = list.filter((a) => seenPackages.has(a.package));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.label.toLowerCase().includes(q) || a.package.toLowerCase().includes(q),
      );
    }
    return list;
  }, [apps, onlyNotifying, query, seenPackages]);

  const isLoading = apps === null;

  function selectAll() {
    if (apps === null) return;
    setSelected(apps.map((a) => a.package));
  }

  function handleClose() {
    router.back();
  }

  function renderApp({ item }: ListRenderItemInfo<InstalledApp>) {
    return (
      <AppPickerRow
        app={item}
        selected={selected.includes(item.package)}
        hasPosted={seenPackages.has(item.package)}
        scheme={scheme}
        onToggle={togglePackage}
      />
    );
  }

  function renderEmpty() {
    return (
      <EmptyState title="No apps found" description="Try a different search term or filter." />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-2 py-2">
        <Pressable
          onPress={handleClose}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <CaretLeft size={BACK_ICON_SIZE} weight="regular" color={p.text} />
        </Pressable>
        <Text className="flex-1 text-lg font-medium text-surface-dark dark:text-white">
          Choose apps
        </Text>
        <Pressable
          onPress={handleClose}
          className="rounded-lg bg-accent px-4 py-2 active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark"
        >
          <Text className="text-sm font-medium text-accent-text dark:text-accent-text-dark">
            Done ({selected.length})
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-3 px-4 py-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2 dark:bg-surface-dark-secondary">
          <MagnifyingGlass size={SEARCH_ICON_SIZE} weight="regular" color={p.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search apps..."
            placeholderTextColor={p.muted}
            className="flex-1 text-sm text-surface-dark dark:text-white"
            autoFocus
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4 py-1">
        <Pressable
          onPress={selectAll}
          disabled={isLoading}
          className={`rounded bg-surface-secondary px-3 py-1 dark:bg-surface-dark-secondary ${
            isLoading
              ? 'opacity-30'
              : 'active:bg-surface-dark-secondary dark:active:bg-surface-secondary'
          }`}
        >
          <Text className="text-xs text-accent dark:text-accent-dark">All apps</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted dark:text-muted-dark">Notifying only</Text>
          <Switch
            value={onlyNotifying}
            onValueChange={setOnlyNotifying}
            trackColor={{
              false: COLORS.switch.trackOff,
              true: COLORS.switch.trackOn,
            }}
            thumbColor={COLORS.switch.thumb}
            className="scale-75"
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingState scheme={scheme} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          renderItem={renderApp}
          className="flex-1"
        />
      )}
    </SafeAreaView>
  );
}
