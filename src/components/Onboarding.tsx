import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BellRinging, CheckCircle, Code, FadersHorizontal } from 'phosphor-react-native';

import { usePermissionStore } from '@/stores/permissions';
import { useSettingsStore } from '@/stores/settings';
import { palette, type ColorScheme } from '@/constants/colors';
import * as NotifFilter from '../../modules/notif-filter/src/index';

const STEP_ICON_SIZE = 64;
const GRANT_ICON_SIZE = 20;

const STEPS = [
  {
    icon: FadersHorizontal,
    title: 'Filter notifications before they appear',
    body: 'NotifFilter checks every incoming notification against your rules. Matching ones are hidden before they reach the status bar.',
  },
  {
    icon: Code,
    title: 'Rules are regular expressions',
    body: 'Each rule matches on the notification title, text, or both — for all apps or only the ones you choose. A rule either blocks or explicitly allows.',
  },
  {
    icon: BellRinging,
    title: 'Grant notification access',
    body: 'Android requires you to allow NotifFilter to read your notifications. Blocked items are stored on this device in History and can be restored from there.',
  },
] as const;

export function Onboarding({ scheme }: { scheme: ColorScheme }) {
  const p = palette(scheme);
  const [step, setStep] = useState(0);

  const listenerEnabled = usePermissionStore((s) => s.listenerEnabled);
  const requestPostNotifications = usePermissionStore((s) => s.requestPostNotifications);
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone);

  const isLastStep = step === STEPS.length - 1;
  const StepIcon = STEPS[step].icon;

  // Asked here rather than on first send, so a fresh install never hits the
  // silent no-op NotificationManager returns without this permission.
  useEffect(() => {
    if (isLastStep) {
      requestPostNotifications();
    }
  }, [isLastStep, requestPostNotifications]);

  function handleBack() {
    setStep((s) => s - 1);
  }

  function handleNext() {
    setStep((s) => s + 1);
  }

  function handleDone() {
    setOnboardingDone(true);
  }

  function handleOpenSettings() {
    NotifFilter.openNotificationAccessSettings();
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <StepIcon size={STEP_ICON_SIZE} weight="regular" color={p.text} />
        <Text className="text-center text-xl font-medium text-surface-dark dark:text-white">
          {STEPS[step].title}
        </Text>
        <Text className="text-center text-base text-muted dark:text-muted-dark">
          {STEPS[step].body}
        </Text>

        {isLastStep ? (
          listenerEnabled ? (
            <View className="mt-2 flex-row items-center gap-2">
              <CheckCircle size={GRANT_ICON_SIZE} weight="regular" color={p.accent} />
              <Text className="text-sm text-surface-dark dark:text-white">
                Notification access granted
              </Text>
            </View>
          ) : (
            <View className="mt-2 items-center gap-2">
              <Pressable
                onPress={handleOpenSettings}
                className="rounded-lg bg-surface-secondary px-4 py-2.5 active:bg-surface-tertiary dark:bg-surface-dark-secondary dark:active:bg-surface-dark-tertiary"
              >
                <Text className="text-sm font-medium text-surface-dark dark:text-white">
                  Open notification settings
                </Text>
              </Pressable>
              <Text className="text-center text-xs text-muted dark:text-muted-dark">
                You can skip this — a banner in the app will remind you later.
              </Text>
            </View>
          )
        ) : null}
      </View>

      <View className="items-center gap-6 px-8 pb-6">
        <View className="flex-row gap-2">
          {STEPS.map((s, i) => (
            <View
              key={s.title}
              className={`h-2 w-2 rounded-full ${
                i === step
                  ? 'bg-accent dark:bg-accent-dark'
                  : 'bg-surface-tertiary dark:bg-surface-dark-tertiary'
              }`}
            />
          ))}
        </View>

        <View className="w-full flex-row items-center gap-3">
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              className="rounded-lg px-4 py-3 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
            >
              <Text className="text-sm font-medium text-muted dark:text-muted-dark">Back</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={isLastStep ? handleDone : handleNext}
            className="flex-1 items-center rounded-lg bg-accent px-4 py-3 active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark"
          >
            <Text className="text-sm font-medium text-accent-text dark:text-accent-text-dark">
              {isLastStep ? 'Done' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
