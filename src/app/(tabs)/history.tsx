import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  AppState,
  type AppStateStatus,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Trash } from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { EmptyState } from "@/components/ui";
import { HistoryItem } from "@/components/HistoryItem";
import { useHistoryStore } from "@/stores/history";
import { usePermissionStore } from "@/stores/permissions";
import { usePickerStore, PICKER_PURPOSE } from "@/stores/picker";
import { palette } from "@/constants/colors";
import type { RuleAction } from "@/stores/rules";
import type { HistoryEntry } from "../../../modules/notif-filter/src/index";

const RULE_LABEL_PREFIX: Record<RuleAction, string> = {
  deny: "Block",
  allow: "Allow",
};

const LIST_CONTENT_STYLE = { flexGrow: 1, paddingBottom: 32 };
const CLEAR_ICON_SIZE = 16;

export default function HistoryScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const p = palette(scheme);

  const entries = useHistoryStore((s) => s.entries);
  const hasMore = useHistoryStore((s) => s.hasMore);
  const loaded = useHistoryStore((s) => s.loaded);
  const loadPage = useHistoryStore((s) => s.loadPage);
  const refresh = useHistoryStore((s) => s.refresh);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const restoreEntry = useHistoryStore((s) => s.restoreEntry);

  const requestPostNotifications = usePermissionStore(
    (s) => s.requestPostNotifications,
  );

  const [refreshing, setRefreshing] = useState(false);
  // Expansion lives here, not in the row: FlatList unmounts rows that scroll out of
  // the window, so row-local state would be lost on the way back.
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const appState = useRef(AppState.currentState);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Only a background -> active transition can have missed rows; inactive ->
  // active is a transient system overlay and the list is already current.
  const handleAppStateChange = useCallback(
    (next: AppStateStatus) => {
      const missedRows = appState.current === "background" && next === "active";
      appState.current = next;
      if (missedRows) refresh();
    },
    [refresh],
  );

  // The tab stays mounted, so only a focus pass picks up rows the service wrote
  // while the user was on another tab. Focus does not re-fire on foregrounding.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener("change", handleAppStateChange);
      return () => sub.remove();
    }, [refresh, handleAppStateChange]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || entries.length === 0) return;
    const oldest = entries[entries.length - 1];
    loadPage(oldest.timestamp);
  }, [hasMore, entries, loadPage]);

  const confirmClearAll = useCallback(() => {
    setExpandedIds(new Set());
    clearAll();
  }, [clearAll]);

  const handleClearAll = () => {
    Alert.alert("Clear history", "Delete all entries? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: confirmClearAll },
    ]);
  };

  async function handleRestore(id: string) {
    if (await requestPostNotifications()) {
      restoreEntry(id);
    }
  }

  function openPrefilledRule(
    pkg: string,
    appLabel: string,
    action: RuleAction,
  ) {
    // Nothing is persisted here — the editor saves only when the user taps Save.
    usePickerStore.getState().open(PICKER_PURPOSE.ruleScope, [pkg]);
    router.push({
      pathname: "/rule/new",
      params: {
        package: pkg,
        action,
        label: `${RULE_LABEL_PREFIX[action]} ${appLabel}`,
      },
    });
  }

  function handleBlockApp(pkg: string, appLabel: string) {
    openPrefilledRule(pkg, appLabel, "deny");
  }

  function handleAllowApp(pkg: string, appLabel: string) {
    openPrefilledRule(pkg, appLabel, "allow");
  }

  function renderEntry({ item }: ListRenderItemInfo<HistoryEntry>) {
    return (
      <HistoryItem
        entry={item}
        scheme={scheme}
        expanded={expandedIds.has(item.id)}
        onToggleExpand={handleToggleExpand}
        onRestore={handleRestore}
        onBlockApp={handleBlockApp}
        onAllowApp={handleAllowApp}
      />
    );
  }

  function renderEmpty() {
    return (
      <EmptyState
        title="No notifications yet"
        description="Notifications the filter sees will appear here, marked shown or blocked."
      />
    );
  }

  if (!loaded) {
    return (
      <View className="flex-1 bg-white dark:bg-surface-dark">
        <EmptyState title="Loading..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-lg font-medium text-surface-dark dark:text-white">
          History
        </Text>
        {entries.length > 0 ? (
          <Pressable
            onPress={handleClearAll}
            className="flex-row items-center gap-1 rounded px-3 py-1.5 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
          >
            <Trash
              size={CLEAR_ICON_SIZE}
              weight="regular"
              color={p.destructive}
            />
            <Text className="text-sm text-red-600 dark:text-red-400">
              Clear all
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={entries}
        extraData={expandedIds}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={LIST_CONTENT_STYLE}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={renderEntry}
      />
    </View>
  );
}
