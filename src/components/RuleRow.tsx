import { View, Pressable } from "react-native";
import { Trash, CaretUp, CaretDown } from "phosphor-react-native";

import { RuleCard } from "@/components/RuleCard";
import { palette } from "@/constants/colors";
import type { Rule } from "@/stores/rules";

const REORDER_ICON_SIZE = 20;
const DELETE_ICON_SIZE = 18;

type Props = {
  rule: Rule;
  index: number;
  count: number;
  scheme: "light" | "dark";
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

export function RuleRow({
  rule,
  index,
  count,
  scheme,
  onEdit,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const p = palette(scheme);
  const isFirst = index === 0;
  const isLast = index === count - 1;

  function handleEdit() {
    onEdit(rule.id);
  }

  function handleToggle() {
    onToggle(rule.id);
  }

  function handleDelete() {
    onDelete(rule.id);
  }

  function handleMoveUp() {
    onMoveUp(index);
  }

  function handleMoveDown() {
    onMoveDown(index);
  }

  return (
    <View className="flex-row items-center">
      {/* h-12 w-12 pads each caret out to a 48dp touch target; the glyph
          alone was too small to hit reliably. */}
      <View className="w-12 items-center py-1">
        <Pressable
          onPress={handleMoveUp}
          disabled={isFirst}
          accessibilityLabel="Move rule up"
          className={`h-12 w-12 items-center justify-center rounded ${
            isFirst
              ? "opacity-30"
              : "active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
          }`}
        >
          <CaretUp size={REORDER_ICON_SIZE} weight="regular" color={p.muted} />
        </Pressable>
        <Pressable
          onPress={handleMoveDown}
          disabled={isLast}
          accessibilityLabel="Move rule down"
          className={`h-12 w-12 items-center justify-center rounded ${
            isLast
              ? "opacity-30"
              : "active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
          }`}
        >
          <CaretDown
            size={REORDER_ICON_SIZE}
            weight="regular"
            color={p.muted}
          />
        </Pressable>
      </View>

      <View className="flex-1">
        <RuleCard
          rule={rule}
          scheme={scheme}
          onPress={handleEdit}
          onToggle={handleToggle}
        />
      </View>

      <Pressable
        onPress={handleDelete}
        accessibilityLabel="Delete rule"
        className="mr-2 h-12 w-12 items-center justify-center rounded-lg active:bg-red-50 dark:active:bg-red-950"
      >
        <Trash size={DELETE_ICON_SIZE} weight="regular" color={p.destructive} />
      </Pressable>
    </View>
  );
}
