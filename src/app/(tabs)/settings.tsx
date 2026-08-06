import { View, Text, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretRight } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { useSettingsStore } from '@/stores/settings';

function SettingRow({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-base text-surface-dark dark:text-white">
          {label}
        </Text>
        {description ? (
          <Text className="text-sm text-muted dark:text-muted-dark">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

function SettingGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="mx-4 mb-6 overflow-hidden rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary">
      {children}
    </View>
  );
}

function Separator() {
  return (
    <View className="mx-4 h-px bg-surface-tertiary dark:bg-surface-dark-tertiary" />
  );
}

function Caret() {
  return <CaretRight size={14} weight="bold" />;
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { defaultPolicy, setDefaultPolicy, filterOngoing, setFilterOngoing } =
    useSettingsStore();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="mt-6">
        <SettingGroup>
          <SettingRow
            label="Default policy"
            description={
              defaultPolicy === 'allow'
                ? 'Show everything unless a rule blocks it'
                : 'Block everything unless a rule allows it'
            }
            action={
              <Pressable
                onPress={() =>
                  setDefaultPolicy(
                    defaultPolicy === 'allow' ? 'block' : 'allow',
                  )
                }
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm capitalize text-muted dark:text-muted-dark">
                  {defaultPolicy === 'allow' ? 'Allow' : 'Block'}
                </Text>
                <Caret />
              </Pressable>
            }
          />
          <Separator />
          <SettingRow
            label="Filter ongoing notifications"
            description="Ongoing notifications are from media, navigation, or calls. Blocking them may stop playback."
            action={
              <Switch
                value={filterOngoing}
                onValueChange={setFilterOngoing}
                trackColor={{
                  false: '#d4d4d8',
                  true: '#d97706',
                }}
                thumbColor="#ffffff"
              />
            }
          />
        </SettingGroup>

        <SettingGroup>
          <SettingRow
            label="Theme"
            description={
              colorScheme === 'dark' ? 'Dark mode' : 'Light mode'
            }
            action={
              <Pressable
                onPress={() =>
                  setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
                }
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {colorScheme === 'dark' ? 'Dark' : 'Light'}
                </Text>
                <Caret />
              </Pressable>
            }
          />
        </SettingGroup>
      </View>
    </SafeAreaView>
  );
}
