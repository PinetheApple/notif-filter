import { View, Pressable, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Trash, CaretUp, CaretDown } from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { EmptyState } from "@/components/ui";
import { AddRuleFab } from "@/components/AddRuleFab";
import { RuleCard } from "@/components/RuleCard";
import { useRulesStore } from "@/stores/rules";
import { useSettingsStore } from "@/stores/settings";
import { usePickerStore } from "@/stores/picker";
import { palette } from "@/constants/colors";

export default function RulesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const p = palette(scheme);

  const rules = useRulesStore((s) => s.rules);
  const defaultPolicy = useSettingsStore((s) => s.defaultPolicy);
  const toggleRule = useRulesStore((s) => s.toggleRule);
  const removeRule = useRulesStore((s) => s.removeRule);
  const reorderRules = useRulesStore((s) => s.reorderRules);

  function handleAdd() {
    usePickerStore.getState().clear();
    router.push("/rule/new");
  }

  function handleEdit(id: string) {
    const rule = rules.find((r) => r.id === id);
    usePickerStore.getState().setSelected(rule?.scopePackages ?? []);
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
        renderItem={({ item, index }) => (
          <View className="flex-row items-center">
            <View className="w-8 items-center gap-0.5 py-2">
              <Pressable
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                className={`h-6 w-6 items-center justify-center rounded ${
                  index === 0
                    ? "opacity-30"
                    : "active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
                }`}
              >
                <CaretUp size={12} weight="regular" color={p.muted} />
              </Pressable>
              <Pressable
                onPress={() => handleMoveDown(index)}
                disabled={index === rules.length - 1}
                className={`h-6 w-6 items-center justify-center rounded ${
                  index === rules.length - 1
                    ? "opacity-30"
                    : "active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
                }`}
              >
                <CaretDown size={12} weight="regular" color={p.muted} />
              </Pressable>
            </View>
            <View className="flex-1">
              <RuleCard
                rule={item}
                scheme={scheme}
                onPress={() => handleEdit(item.id)}
                onToggle={() => handleToggle(item.id)}
              />
            </View>
            <Pressable
              onPress={() => handleDelete(item.id)}
              className="mr-2 h-10 w-10 items-center justify-center rounded-lg active:bg-red-50 dark:active:bg-red-950"
            >
              <Trash size={18} weight="regular" color={p.destructive} />
            </Pressable>
          </View>
        )}
      />

      <AddRuleFab onPress={handleAdd} scheme={scheme} />
    </View>
  );
}
