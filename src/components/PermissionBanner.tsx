import { View, Text, Pressable } from 'react-native';
import { Warning } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { usePermissionStore } from '@/stores/permissions';
import * as NotifFilter from '../../modules/notif-filter/src/index';

export function PermissionBanner() {
  const { colorScheme } = useColorScheme();
  const listenerEnabled = usePermissionStore((s) => s.listenerEnabled);
  const setListenerEnabled = usePermissionStore((s) => s.setListenerEnabled);
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  if (listenerEnabled !== false) return null;

  const handleOpenSettings = () => {
    NotifFilter.openNotificationAccessSettings();
  };

  return (
    <Pressable
      onPress={handleOpenSettings}
      className="mx-4 mt-3 flex-row items-center gap-3 rounded-lg bg-amber-100 px-4 py-3 dark:bg-amber-900 active:scale-[0.98]"
    >
      <Warning
        size={20}
        weight="regular"
        color={scheme === 'dark' ? '#fde68a' : '#92400e'}
      />
      <View className="flex-1">
        <Text className="text-sm font-medium text-amber-900 dark:text-amber-100">
          Notification access required
        </Text>
        <Text className="text-xs text-amber-700 dark:text-amber-300">
          Tap to enable in system settings
        </Text>
      </View>
    </Pressable>
  );
}
