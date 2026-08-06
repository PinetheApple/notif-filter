import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, Check, MagnifyingGlass } from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { usePickerStore } from "@/stores/picker";
import { EmptyState } from "@/components/ui";
import { palette, COLORS } from "@/constants/colors";
import * as NotifFilter from "../../modules/notif-filter/src/index";

export default function AppPickerScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const p = palette(scheme);

  const selected = usePickerStore((s) => s.selected);
  const togglePackage = usePickerStore((s) => s.togglePackage);
  const setSelected = usePickerStore((s) => s.setSelected);

  const [query, setQuery] = useState("");
  const [onlyNotifying, setOnlyNotifying] = useState(false);

  const apps = useMemo(() => NotifFilter.listInstalledApps(), []);
  const seenPackages = useMemo(
    () => new Set(NotifFilter.getSeenPackages()),
    [],
  );

  const filtered = useMemo(() => {
    let list = apps;
    if (onlyNotifying) {
      list = list.filter((a) => seenPackages.has(a.package));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.package.toLowerCase().includes(q),
      );
    }
    return list;
  }, [apps, onlyNotifying, query, seenPackages]);

  function selectAll() {
    setSelected(apps.map((a) => a.package));
  }

  function handleConfirm() {
    router.back();
  }

  function renderAppIcon(packageName: string) {
    try {
      const uri = NotifFilter.getAppIcon(packageName);
      if (uri) {
        return <Image source={{ uri }} className="h-8 w-8 rounded" />;
      }
    } catch {
      // Fall through to placeholder
    }
    return (
      <View className="h-8 w-8 items-center justify-center rounded bg-surface-secondary dark:bg-surface-dark-secondary">
        <Text className="text-[10px] text-muted dark:text-muted-dark">App</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-2 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <CaretLeft size={22} weight="regular" color={p.text} />
        </Pressable>
        <Text className="flex-1 text-lg font-medium text-surface-dark dark:text-white">
          Choose apps
        </Text>
        <Pressable
          onPress={handleConfirm}
          className="rounded-lg bg-accent px-4 py-2 active:bg-accent-pressed dark:active:bg-accent-pressed-dark"
        >
          <Text className="text-sm font-medium text-accent-text">
            Done ({selected.length})
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-3 px-4 py-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2 dark:bg-surface-dark-secondary">
          <MagnifyingGlass size={16} weight="regular" color={p.muted} />
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
          className="rounded bg-surface-secondary px-3 py-1 active:bg-surface-dark-secondary dark:bg-surface-dark-secondary dark:active:bg-surface-secondary"
        >
          <Text className="text-xs text-accent">All apps</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted dark:text-muted-dark">
            Notifying only
          </Text>
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.package}
        ListEmptyComponent={
          <EmptyState
            title="No apps found"
            description="Try a different search term or filter."
          />
        }
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.package);
          const hasPosted = seenPackages.has(item.package);

          return (
            <Pressable
              onPress={() => togglePackage(item.package)}
              className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
            >
              {renderAppIcon(item.package)}
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-surface-dark dark:text-white">
                  {item.label}
                </Text>
                {hasPosted ? (
                  <Text className="text-[11px] text-muted dark:text-muted-dark">
                    Has sent notifications
                  </Text>
                ) : null}
              </View>
              {isSelected ? (
                <Check size={18} weight="regular" color={p.text} />
              ) : (
                <View className="h-[18px] w-[18px] rounded-full border border-surface-secondary dark:border-surface-dark-secondary" />
              )}
            </Pressable>
          );
        }}
        className="flex-1"
      />
    </SafeAreaView>
  );
}
