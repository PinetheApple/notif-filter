import { useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Trash } from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { EmptyState } from "@/components/ui";
import { HistoryItem } from "@/components/HistoryItem";
import { useHistoryStore } from "@/stores/history";
import { useRulesStore } from "@/stores/rules";
import { usePermissionStore } from "@/stores/permissions";
import { palette } from "@/constants/colors";

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

  const addRule = useRulesStore((s) => s.addRule);
  const requestPostNotifications = usePermissionStore(
    (s) => s.requestPostNotifications,
  );

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || entries.length === 0) return;
    const oldest = entries[entries.length - 1];
    loadPage(oldest.timestamp);
  }, [hasMore, entries, loadPage]);

  const handleClearAll = () => {
    Alert.alert("Clear history", "Delete all entries? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearAll },
    ]);
  };

  async function handleRestore(id: string) {
    if (await requestPostNotifications()) {
      restoreEntry(id);
    }
  }

  function handleBlockApp(pkg: string, label: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    addRule({
      id,
      label: `Block ${label}`,
      enabled: true,
      scopeKind: "packages",
      scopePackages: [pkg],
      pattern: ".*",
      caseInsensitive: true,
      field: "any",
      action: "deny",
      updatedAt: Date.now(),
    });
    router.push(`/rule/${id}`);
  }

  function handleAllowApp(pkg: string, label: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    addRule({
      id,
      label: `Allow ${label}`,
      enabled: true,
      scopeKind: "packages",
      scopePackages: [pkg],
      pattern: ".*",
      caseInsensitive: true,
      field: "any",
      action: "allow",
      updatedAt: Date.now(),
    });
    router.push(`/rule/${id}`);
  }

  if (!loaded) {
    return (
      <View className="flex-1 bg-white dark:bg-surface-dark">
        <EmptyState title="Loading..." />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View className="flex-1 bg-white dark:bg-surface-dark">
        <EmptyState
          title="No notifications yet"
          description="Notifications the filter sees will appear here, marked shown or blocked."
        />
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
        <Pressable
          onPress={handleClearAll}
          className="flex-row items-center gap-1 rounded px-3 py-1.5 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <Trash size={16} weight="regular" color={p.destructive} />
          <Text className="text-sm text-red-600 dark:text-red-400">
            Clear all
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 32 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <HistoryItem
            entry={item}
            scheme={scheme}
            onRestore={() => handleRestore(item.id)}
            onBlockApp={() => handleBlockApp(item.package, item.appLabel)}
            onAllowApp={() => handleAllowApp(item.package, item.appLabel)}
          />
        )}
      />
    </View>
  );
}
