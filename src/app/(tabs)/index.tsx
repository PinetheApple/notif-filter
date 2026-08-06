import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

export default function RulesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-lg font-medium text-surface-dark dark:text-white">
          No rules yet
        </Text>
        <Text className="text-center text-base text-muted dark:text-muted-dark">
          Add a rule to start filtering notifications.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/rule/new')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg active:scale-95"
      >
        <Plus
          size={26}
          weight="bold"
          color={scheme === 'dark' ? '#09090b' : '#ffffff'}
        />
      </Pressable>
    </SafeAreaView>
  );
}
