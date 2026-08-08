import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { useRulesStore } from '@/stores/rules';
import { RuleForm } from '@/components/RuleForm';
import { EmptyState } from '@/components/ui';

export default function EditRuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rule = useRulesStore((s) => s.rules.find((r) => r.id === id));
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  if (!rule) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
        <EmptyState title="Rule not found" description="This rule may have been deleted." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <RuleForm initialRule={rule} scheme={scheme} />
    </SafeAreaView>
  );
}
