import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-lg font-medium text-surface-dark dark:text-white">
          No notifications yet
        </Text>
        <Text className="text-center text-base text-muted dark:text-muted-dark">
          Filtered notifications will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
