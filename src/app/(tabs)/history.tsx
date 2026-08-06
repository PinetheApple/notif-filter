import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui';

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <EmptyState
        title="No notifications yet"
        description="Filtered notifications will appear here."
      />
    </SafeAreaView>
  );
}
