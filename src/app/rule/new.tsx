import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { RuleForm } from '@/components/RuleForm';
import type { Rule, RuleAction } from '@/stores/rules';

/** A per-app rule from history starts wide open; the user narrows it before saving. */
const MATCH_ALL_PATTERN = '.*';

const DEFAULT_ACTION: RuleAction = 'deny';
const RULE_ACTIONS: RuleAction[] = ['deny', 'allow'];

type PrefillParams = {
  package?: string;
  action?: string;
  label?: string;
};

// Route params arrive as arbitrary strings, so an unknown action would otherwise
// be persisted and then rejected by the native rule parser.
function toRuleAction(value: string | undefined): RuleAction {
  if (value && RULE_ACTIONS.includes(value as RuleAction)) {
    return value as RuleAction;
  }
  return DEFAULT_ACTION;
}

export default function NewRuleScreen() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const params = useLocalSearchParams<PrefillParams>();

  const draft = useMemo<Partial<Rule> | undefined>(() => {
    if (!params.package) return undefined;
    return {
      label: params.label ?? '',
      action: toRuleAction(params.action),
      scopeKind: 'packages',
      scopePackages: [params.package],
      pattern: MATCH_ALL_PATTERN,
      caseInsensitive: true,
      field: 'any',
    };
  }, [params.package, params.action, params.label]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <RuleForm draft={draft} scheme={scheme} />
    </SafeAreaView>
  );
}
