import { View, Text, Switch, Pressable } from "react-native";
import { CaretRight } from "phosphor-react-native";

import { Badge } from "@/components/ui";
import { palette, COLORS } from "@/constants/colors";
import type { Rule } from "@/stores/rules";

function ScopeLabel({ rule }: { rule: Rule }) {
  if (rule.scopeType === "all") {
    return (
      <View className="rounded bg-surface-secondary px-1.5 py-0.5 dark:bg-surface-dark-secondary">
        <Text className="text-[11px] text-muted dark:text-muted-dark">
          All apps
        </Text>
      </View>
    );
  }

  const count = rule.scopePackages.length;
  return (
    <View className="rounded bg-surface-secondary px-1.5 py-0.5 dark:bg-surface-dark-secondary">
      <Text className="text-[11px] text-muted dark:text-muted-dark">
        {count} {count === 1 ? "app" : "apps"}
      </Text>
    </View>
  );
}

export function RuleCard({
  rule,
  onPress,
  onToggle,
  scheme,
}: {
  rule: Rule;
  onPress: () => void;
  onToggle: () => void;
  scheme: "light" | "dark";
}) {
  const p = palette(scheme);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg bg-white px-4 py-3 active:bg-surface-secondary dark:bg-surface-dark dark:active:bg-surface-dark-secondary"
    >
      <Switch
        value={rule.enabled}
        onValueChange={onToggle}
        trackColor={{
          false: COLORS.switch.trackOff,
          true: COLORS.switch.trackOn,
        }}
        thumbColor={COLORS.switch.thumb}
        className="scale-90"
      />

      <View className="flex-1 gap-1.5">
        {rule.label ? (
          <Text
            className="text-sm font-medium text-surface-dark dark:text-white"
            numberOfLines={1}
          >
            {rule.label}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-1.5">
          <ScopeLabel rule={rule} />
          <Badge label={rule.action} variant={rule.action} />
        </View>
        <Text
          className="font-mono text-xs text-muted dark:text-muted-dark"
          numberOfLines={1}
        >
          {rule.pattern}
        </Text>
      </View>

      <CaretRight size={16} weight="regular" color={p.muted} />
    </Pressable>
  );
}
