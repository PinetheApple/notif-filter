import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

export default function RuleEditorScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  function goBack() {
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-2 py-2">
        <Pressable
          onPress={goBack}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <CaretLeft
            size={22}
            weight="bold"
            color={scheme === 'dark' ? '#fafafa' : '#18181b'}
          />
        </Pressable>
        <Text className="text-lg font-medium text-surface-dark dark:text-white">
          New rule
        </Text>
      </View>

      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-lg font-medium text-surface-dark dark:text-white">
          Rule editor
        </Text>
        <Text className="text-center text-base text-muted dark:text-muted-dark">
          App scope picker, regex pattern, allow/deny — wired in M3.
        </Text>
      </View>
    </SafeAreaView>
  );
}
