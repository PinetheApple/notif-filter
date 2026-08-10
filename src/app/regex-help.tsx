import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { RegexHelp } from '@/components/RegexHelp';
import { palette } from '@/constants/colors';

const CONTENT_PADDING_BOTTOM = 32;

export default function RegexHelpScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  function handleBack() {
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-2 py-2">
        <Pressable
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <CaretLeft size={22} weight="regular" color={p.text} />
        </Pressable>
        <Text className="flex-1 text-lg font-medium text-surface-dark dark:text-white">
          Pattern help
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM }}
      >
        <View className="mt-2">
          <RegexHelp />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
