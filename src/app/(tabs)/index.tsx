import { View, FlatList, Alert, type ListRenderItemInfo } from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";

import { EmptyState } from "@/components/ui";
import { AddRuleFab } from "@/components/AddRuleFab";
import { RuleRow } from "@/components/RuleRow";
import { useRulesStore, type Rule } from "@/stores/rules";
import { useSettingsStore } from "@/stores/settings";
import { usePickerStore, PICKER_PURPOSE } from "@/stores/picker";

export default function RulesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  const rules = useRulesStore((s) => s.rules);
  const defaultPolicy = useSettingsStore((s) => s.defaultPolicy);
  const toggleRule = useRulesStore((s) => s.toggleRule);
  const removeRule = useRulesStore((s) => s.removeRule);
  const reorderRules = useRulesStore((s) => s.reorderRules);

  function handleAdd() {
    usePickerStore.getState().open(PICKER_PURPOSE.ruleScope, []);
    router.push("/rule/new");
  }

  function handleEdit(id: string) {
    const rule = rules.find((r) => r.id === id);
    usePickerStore
      .getState()
      .open(PICKER_PURPOSE.ruleScope, rule?.scopePackages ?? []);
    router.push(`/rule/${id}`);
  }

  function handleToggle(id: string) {
    toggleRule(id);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete rule", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeRule(id) },
    ]);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const ids = rules.map((r) => r.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderRules(ids);
  }

  function handleMoveDown(index: number) {
    if (index === rules.length - 1) return;
    const ids = rules.map((r) => r.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderRules(ids);
  }

  function renderRule({ item, index }: ListRenderItemInfo<Rule>) {
    return (
      <RuleRow
        rule={item}
        index={index}
        count={rules.length}
        scheme={scheme}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    );
  }

  if (rules.length === 0) {
    return (
      <View className="flex-1 bg-white dark:bg-surface-dark">
        <EmptyState
          title="No rules yet"
          description={
            defaultPolicy === "allow"
              ? "Everything shows until a rule blocks it. Tap the + button to add a rule."
              : "Everything is blocked until a rule allows it. Tap the + button to add a rule."
          }
        />

        <AddRuleFab onPress={handleAdd} scheme={scheme} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="h-px" />}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 80 }}
        renderItem={renderRule}
      />

      <AddRuleFab onPress={handleAdd} scheme={scheme} />
    </View>
  );
}
