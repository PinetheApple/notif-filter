import { View, ActivityIndicator } from 'react-native';

import { palette } from '@/constants/colors';

export function LoadingState({ scheme }: { scheme: 'light' | 'dark' }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <ActivityIndicator size="large" color={palette(scheme).accent} />
    </View>
  );
}
