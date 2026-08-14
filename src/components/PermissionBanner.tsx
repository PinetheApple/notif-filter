import { View, Text, Pressable } from 'react-native';
import { Warning } from 'phosphor-react-native';

import { usePermissionStore } from '@/stores/permissions';
import { palette } from '@/constants/colors';
import * as NotifFilter from '../../modules/notif-filter/src/index';

type Props = {
  scheme: 'light' | 'dark';
};

export function PermissionBanner({ scheme }: Props) {
  const listenerEnabled = usePermissionStore((s) => s.listenerEnabled);
  const p = palette(scheme);

  if (listenerEnabled !== false) return null;

  const handleOpenSettings = () => {
    NotifFilter.openNotificationAccessSettings();
  };

  return (
    <Pressable
      onPress={handleOpenSettings}
      className="mx-4 mt-3 flex-row items-center gap-3 rounded-lg bg-warning-surface px-4 py-3 active:scale-[0.98] dark:bg-warning-surface-dark"
    >
      <Warning size={20} weight="regular" color={p.warning} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-warning dark:text-warning-dark">
          Notification access required
        </Text>
        <Text className="text-xs text-warning-muted dark:text-warning-muted-dark">
          Tap to enable in system settings
        </Text>
      </View>
    </Pressable>
  );
}
