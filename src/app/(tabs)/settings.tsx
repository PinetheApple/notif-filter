import { useState, useCallback } from 'react';
import { View, Text, Switch, Pressable, TextInput, ScrollView, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowSquareOut, CaretRight } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { Dialog, ListRow, ListSection, SegmentedControl, Separator } from '@/components/ui';
import { RulesTransferSection, type Notice } from '@/components/RulesTransferSection';
import { useSettingsStore } from '@/stores/settings';
import { usePickerStore, PICKER_PURPOSE } from '@/stores/picker';
import { usePermissionStore } from '@/stores/permissions';
import { palette, COLORS } from '@/constants/colors';
import * as NotifFilter from '../../../modules/notif-filter/src/index';

const REPO_URL = 'https://github.com/PinetheApple/notif-filter';
const THEME_AUTO_OPTION = 'system';
const THEME_OPTIONS = [THEME_AUTO_OPTION, 'light', 'dark'] as const;
const POLICY_OPTIONS = ['allow', 'block'] as const;
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

type ThemeOption = (typeof THEME_OPTIONS)[number];

const NOTICE_PERMISSION: Notice = {
  title: 'Notification permission needed',
  message:
    'Android will not show notifications from NotifFilter until you allow them in system settings.',
};

function capitalize(option: string): string {
  return option.charAt(0).toUpperCase() + option.slice(1);
}

function formatThemeLabel(option: ThemeOption): string {
  return option === THEME_AUTO_OPTION ? 'Auto' : capitalize(option);
}

function isSameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((pkg, i) => pkg === b[i]);
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
  const requestPostNotifications = usePermissionStore((s) => s.requestPostNotifications);

  const [logSizeText, setLogSizeText] = useState(String(logSize));
  const [notice, setNotice] = useState<Notice | null>(null);

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
      setNotice(NOTICE_PERMISSION);
      return;
    }

    NotifFilter.postTestNotification('Test notification', 'This is a test from NotifFilter');
  }

  function handlePatternHelpTap() {
    router.push('/regex-help');
  }

  function handleNoticeDismiss() {
    setNotice(null);
  }

  function handleOpenRepo() {
    Linking.openURL(REPO_URL);
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
                <SegmentedControl
                  options={POLICY_OPTIONS}
                  value={defaultPolicy}
                  onChange={setDefaultPolicy}
                  formatLabel={capitalize}
                  size="sm"
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
                <SegmentedControl
                  options={THEME_OPTIONS}
                  value={(colorScheme as ThemeOption) ?? THEME_AUTO_OPTION}
                  onChange={handleThemeChange}
                  formatLabel={formatThemeLabel}
                  size="sm"
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

          <RulesTransferSection scheme={scheme} onNotice={setNotice} />

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

      {notice ? (
        <Dialog
          visible
          title={notice.title}
          message={notice.message}
          onDismiss={handleNoticeDismiss}
        />
      ) : null}
    </View>
  );
}
