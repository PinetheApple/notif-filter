import { useState } from "react";
import {
  View,
  Text,
  Switch,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Export, FileArrowDown } from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { ListRow, ListSection, Separator } from "@/components/ui";
import { useSettingsStore } from "@/stores/settings";
import { useRulesStore, type Rule } from "@/stores/rules";
import { palette, COLORS } from "@/constants/colors";
import * as NotifFilter from "../../../modules/notif-filter/src/index";

function SegmentedPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row overflow-hidden rounded-lg">
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          className={`px-3 py-1.5 ${
            opt === value
              ? "bg-accent"
              : "bg-surface-secondary dark:bg-surface-dark-secondary"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              opt === value
                ? "text-accent-text"
                : "text-surface-dark dark:text-white"
            }`}
          >
            {opt === "system"
              ? "Auto"
              : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const p = palette(scheme);

  const defaultPolicy = useSettingsStore((s) => s.defaultPolicy);
  const setDefaultPolicy = useSettingsStore((s) => s.setDefaultPolicy);
  const filterOngoing = useSettingsStore((s) => s.filterOngoing);
  const setFilterOngoing = useSettingsStore((s) => s.setFilterOngoing);
  const logSize = useSettingsStore((s) => s.logSize);
  const setLogSize = useSettingsStore((s) => s.setLogSize);

  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const rules = useRulesStore((s) => s.rules);
  const importRules = useRulesStore((s) => s.importRules);

  const [logSizeText, setLogSizeText] = useState(String(logSize));
  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState("");

  function handleLogSizeChange(text: string) {
    setLogSizeText(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n >= 10 && n <= 10000) {
      setLogSize(n);
    }
  }

  function handleLogSizeBlur() {
    setLogSizeText(String(logSize));
  }

  function handleThemeChange(v: string) {
    setColorScheme(v as 'system' | 'light' | 'dark');
    setThemePreference(v as 'system' | 'light' | 'dark');
  }

  function handleSendTest() {
    NotifFilter.postTestNotification(
      "Test notification",
      "This is a test from NotifFilter",
    );
  }

  function handleExport() {
    const json = JSON.stringify(rules, null, 2);
    const { Share } = require("react-native");
    Share.share({ message: json, title: "NotifFilter rules export" });
  }

  function handleImportTap() {
    setImportVisible(!importVisible);
    setImportJson("");
  }

  function handleImportExecute(mode: "merge" | "replace") {
    try {
      const parsed: Rule[] = JSON.parse(importJson);
      if (!Array.isArray(parsed) || !parsed.every((r) => r.id && r.pattern)) {
        Alert.alert(
          "Invalid format",
          "The pasted text is not a valid rules export.",
        );
        return;
      }
      importRules(
        parsed.map((r) => ({ ...r, updatedAt: r.updatedAt ?? Date.now() })),
        mode,
      );
      setImportVisible(false);
      setImportJson("");
    } catch {
      Alert.alert("Invalid JSON", "Could not parse the pasted text.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-6">
          <ListSection>
            <ListRow
              label="Default policy"
              description={
                defaultPolicy === "allow"
                  ? "Show everything unless a rule blocks it"
                  : "Block everything unless a rule allows it"
              }
              action={
                <SegmentedPicker
                  options={["allow", "block"] as const}
                  value={defaultPolicy}
                  onChange={setDefaultPolicy}
                />
              }
            />
            <Separator />
            <ListRow
              label="Filter ongoing notifications"
              description="Ongoing notifications are from media, navigation, or calls. Blocking them may stop playback."
              action={
                <Switch
                  value={filterOngoing}
                  onValueChange={setFilterOngoing}
                  trackColor={{
                    false: COLORS.switch.trackOff,
                    true: COLORS.switch.trackOn,
                  }}
                  thumbColor={COLORS.switch.thumb}
                />
              }
            />
            <Separator />
            <ListRow
              label="Log size"
              description="Maximum number of entries in the blocked log"
              action={
                <TextInput
                  value={logSizeText}
                  onChangeText={handleLogSizeChange}
                  onBlur={handleLogSizeBlur}
                  keyboardType="number-pad"
                  className="w-16 rounded bg-surface-secondary px-2 py-1 text-center text-sm text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
                />
              }
            />
          </ListSection>

          <ListSection>
            <ListRow
              label="Theme"
              description={colorScheme === "dark" ? "Dark mode" : "Light mode"}
              action={
                <SegmentedPicker
                  options={["system", "light", "dark"] as const}
                  value={
                    (colorScheme as "system" | "light" | "dark") ?? "system"
                  }
                  onChange={handleThemeChange}
                />
              }
            />
          </ListSection>

          <ListSection>
            <ListRow
              label="Send test notification"
              description="Post a test notification through the filter pipeline"
              action={
                <Pressable
                  onPress={handleSendTest}
                  className="rounded bg-accent px-3 py-1.5 active:bg-amber-600"
                >
                  <Text className="text-xs font-medium text-accent-text">
                    Send
                  </Text>
                </Pressable>
              }
            />
          </ListSection>

          <ListSection>
            <ListRow
              label="Export rules"
              description={`${rules.length} rule${rules.length === 1 ? "" : "s"} as JSON`}
              action={
                <Pressable
                  onPress={handleExport}
                  className="flex-row items-center gap-1"
                >
                  <Export size={16} weight="regular" color={p.muted} />
                </Pressable>
              }
            />
            <Separator />
            <ListRow
              label="Import rules"
              description="Paste JSON from a previous export"
              action={
                <Pressable
                  onPress={handleImportTap}
                  className="flex-row items-center gap-1"
                >
                  <FileArrowDown size={16} weight="regular" color={p.muted} />
                </Pressable>
              }
            />
            {importVisible ? (
              <View className="gap-2 px-4 pb-3">
                <TextInput
                  value={importJson}
                  onChangeText={setImportJson}
                  placeholder="Paste exported JSON here"
                  placeholderTextColor={p.muted}
                  multiline
                  className="h-24 rounded bg-surface-secondary p-2 text-xs text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleImportExecute("replace")}
                    className="flex-1 rounded bg-accent px-3 py-1.5 active:bg-amber-600"
                  >
                    <Text className="text-center text-xs font-medium text-accent-text">
                      Replace all
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleImportExecute("merge")}
                    className="flex-1 rounded bg-surface-secondary px-3 py-1.5 active:bg-surface-dark-secondary dark:bg-surface-dark-secondary dark:active:bg-surface-secondary"
                  >
                    <Text className="text-center text-xs font-medium text-surface-dark dark:text-white">
                      Merge
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ListSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
