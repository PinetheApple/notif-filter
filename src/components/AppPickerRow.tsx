import { View, Text, Pressable, Image } from 'react-native';
import { Check } from 'phosphor-react-native';

import { palette } from '@/constants/colors';
import type { InstalledApp } from '../../modules/notif-filter/src/index';
import * as NotifFilter from '../../modules/notif-filter/src/index';

const CHECK_ICON_SIZE = 18;
const CHECK_PLACEHOLDER_SIZE = { height: CHECK_ICON_SIZE, width: CHECK_ICON_SIZE };

type Props = {
  app: InstalledApp;
  selected: boolean;
  hasPosted: boolean;
  scheme: 'light' | 'dark';
  onToggle: (packageName: string) => void;
};

function AppIcon({ packageName }: { packageName: string }) {
  let uri = '';
  try {
    uri = NotifFilter.getAppIcon(packageName);
  } catch {
    uri = '';
  }

  if (uri) return <Image source={{ uri }} className="h-8 w-8 rounded" />;

  return (
    <View className="h-8 w-8 items-center justify-center rounded bg-surface-secondary dark:bg-surface-dark-secondary">
      <Text className="text-2xs text-muted dark:text-muted-dark">App</Text>
    </View>
  );
}

export function AppPickerRow({ app, selected, hasPosted, scheme, onToggle }: Props) {
  const p = palette(scheme);

  function handlePress() {
    onToggle(app.package);
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
    >
      <AppIcon packageName={app.package} />
      <View className="flex-1 gap-0.5">
        <Text className="text-sm text-surface-dark dark:text-white">{app.label}</Text>
        {hasPosted ? (
          <Text className="text-2xs text-muted dark:text-muted-dark">Has sent notifications</Text>
        ) : null}
      </View>
      {selected ? (
        <Check size={CHECK_ICON_SIZE} weight="regular" color={p.text} />
      ) : (
        <View
          style={CHECK_PLACEHOLDER_SIZE}
          className="rounded-full border border-surface-secondary dark:border-surface-dark-secondary"
        />
      )}
    </Pressable>
  );
}
