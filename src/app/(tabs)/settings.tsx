import { useState, useCallback } from 'react';
import { View, Text, Switch, Pressable, TextInput, Alert, ScrollView, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowSquareOut, CaretRight, Export, FileArrowDown } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { ListRow, ListSection, Separator } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings';
import { usePickerStore, PICKER_PURPOSE } from '@/stores/picker';
import { useRulesStore, type Rule } from '@/stores/rules';
import { usePermissionStore } from '@/stores/permissions';
import { palette, COLORS } from '@/constants/colors';
import * as NotifFilter from '../../../modules/notif-filter/src/index';

const REPO_URL = 'https://github.com/PinetheApple/notif-filter';
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

function isSameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((pkg, i) => pkg === b[i]);
}

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
              ? 'bg-accent dark:bg-accent-dark'
              : 'bg-surface-secondary dark:bg-surface-dark-secondary'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              opt === value
                ? 'text-accent-text dark:text-accent-text-dark'
                : 'text-surface-dark dark:text-white'
            }`}
          >
            {opt === 'system' ? 'Auto' : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  const defaultPolicy = useSettingsStore((s) => s.defaultPolicy);
  const setDefaultPolicy = useSettingsStore((s) => s.setDefaultPolicy);
  const filterOngoing = useSettingsStore((s) => s.filterOngoing);
  const setFilterOngoing = useSettingsStore((s) => s.setFilterOngoing);
  const logSize = useSettingsStore((s) => s.logSize);
  const setLogSize = useSettingsStore((s) => s.setLogSize);
  const ignoredPackages = useSettingsStore((s) => s.ignoredPackages);
  const setIgnoredPackages = useSettingsStore((s) => s.setIgnoredPackages);

  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const rules = useRulesStore((s) => s.rules);
  const requestPostNotifications = usePermissionStore((s) => s.requestPostNotifications);
  const importRules = useRulesStore((s) => s.importRules);

  const [logSizeText, setLogSizeText] = useState(String(logSize));
  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState('');

  useFocusEffect(
    useCallback(() => {
      const picker = usePickerStore.getState();
      if (picker.purpose !== PICKER_PURPOSE.ignoredApps) return;
      if (isSameSelection(picker.selected, ignoredPackages)) return;
      setIgnoredPackages(picker.selected);
    }, [ignoredPackages, setIgnoredPackages]),
  );

  function handleIgnoredAppsTap() {
    usePickerStore.getState().open(PICKER_PURPOSE.ignoredApps, ignoredPackages);
    router.push('/picker');
  }

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

  async function handleSendTest() {
    const granted = await requestPostNotifications();
    if (!granted) {
      Alert.alert(
        'Notification permission needed',
        'Android will not show notifications from NotifFilter until you allow them in system settings.',
      );
      return;
    }

    NotifFilter.postTestNotification('Test notification', 'This is a test from NotifFilter');
  }

  function handleExport() {
    const json = JSON.stringify(rules, null, 2);
    const { Share } = require('react-native');
    Share.share({ message: json, title: 'NotifFilter rules export' });
  }

  function handleImportTap() {
    setImportVisible(!importVisible);
    setImportJson('');
  }

  function handlePatternHelpTap() {
    router.push('/regex-help');
  }

  function handleOpenRepo() {
    Linking.openURL(REPO_URL);
  }

  function handleImportExecute(mode: 'merge' | 'replace') {
    try {
      const parsed: Rule[] = JSON.parse(importJson);
      if (!Array.isArray(parsed) || !parsed.every((r) => r.id && r.pattern)) {
        Alert.alert('Invalid format', 'The pasted text is not a valid rules export.');
        return;
      }
      importRules(
        parsed.map((r) => ({ ...r, updatedAt: r.updatedAt ?? Date.now() })),
        mode,
      );
      setImportVisible(false);
      setImportJson('');
    } catch {
      Alert.alert('Invalid JSON', 'Could not parse the pasted text.');
    }
  }

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-6">
          <ListSection>
            <ListRow
              label="Default policy"
              description={
                defaultPolicy === 'allow'
                  ? 'Show everything unless a rule blocks it'
                  : 'Block everything unless a rule allows it'
              }
              action={
                <SegmentedPicker
                  options={['allow', 'block'] as const}
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
            <Pressable
              onPress={handleIgnoredAppsTap}
              className="active:bg-surface-tertiary dark:active:bg-surface-dark-tertiary"
            >
              <ListRow
                label="Ignored apps"
                description="Notifications from these apps are never filtered or logged"
                action={
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm text-muted dark:text-muted-dark">
                      {ignoredPackages.length}
                    </Text>
                    <CaretRight size={16} weight="regular" color={p.muted} />
                  </View>
                }
              />
            </Pressable>
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
              description={colorScheme === 'dark' ? 'Dark mode' : 'Light mode'}
              action={
                <SegmentedPicker
                  options={['system', 'light', 'dark'] as const}
                  value={(colorScheme as 'system' | 'light' | 'dark') ?? 'system'}
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
                  className="rounded bg-accent px-3 py-1.5 active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark"
                >
                  <Text className="text-xs font-medium text-accent-text dark:text-accent-text-dark">
                    Send
                  </Text>
                </Pressable>
              }
            />
          </ListSection>

          <ListSection>
            <Pressable
              onPress={handlePatternHelpTap}
              className="active:bg-surface-tertiary dark:active:bg-surface-dark-tertiary"
            >
              <ListRow
                label="Pattern help"
                description="Regex syntax and how rule matching works"
                action={<CaretRight size={16} weight="regular" color={p.muted} />}
              />
            </Pressable>
          </ListSection>

          <ListSection>
            <ListRow
              label="Export rules"
              description={`${rules.length} rule${rules.length === 1 ? '' : 's'} as JSON`}
              action={
                <Pressable onPress={handleExport} className="flex-row items-center gap-1">
                  <Export size={16} weight="regular" color={p.muted} />
                </Pressable>
              }
            />
            <Separator />
            <ListRow
              label="Import rules"
              description="Paste JSON from a previous export"
              action={
                <Pressable onPress={handleImportTap} className="flex-row items-center gap-1">
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
                    onPress={() => handleImportExecute('replace')}
                    className="flex-1 rounded bg-accent px-3 py-1.5 active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark"
                  >
                    <Text className="text-center text-xs font-medium text-accent-text dark:text-accent-text-dark">
                      Replace all
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleImportExecute('merge')}
                    className="flex-1 rounded bg-surface-secondary px-3 py-1.5 active:bg-surface-tertiary dark:bg-surface-dark-secondary dark:active:bg-surface-dark-tertiary"
                  >
                    <Text className="text-center text-xs font-medium text-surface-dark dark:text-white">
                      Merge
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ListSection>

          <ListSection>
            <ListRow
              label="Version"
              action={
                <Text className="text-sm text-muted dark:text-muted-dark">{APP_VERSION}</Text>
              }
            />
            <Separator />
            <ListRow
              label="Privacy"
              description="All processing happens on this device. Notification content never leaves it."
            />
            <Separator />
            <Pressable
              onPress={handleOpenRepo}
              className="active:bg-surface-tertiary dark:active:bg-surface-dark-tertiary"
            >
              <ListRow
                label="Source code"
                description="github.com/PinetheApple/notif-filter"
                action={<ArrowSquareOut size={16} weight="regular" color={p.muted} />}
              />
            </Pressable>
          </ListSection>
        </View>
      </ScrollView>
    </View>
  );
}
