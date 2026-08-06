import { Pressable } from "react-native";
import { Plus } from "phosphor-react-native";

import { palette } from "@/constants/colors";

const FAB_ICON_SIZE = 26;

export function AddRuleFab({
  onPress,
  scheme,
}: {
  onPress: () => void;
  scheme: "light" | "dark";
}) {
  const p = palette(scheme);

  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg active:scale-95 dark:bg-accent-dark"
    >
      <Plus size={FAB_ICON_SIZE} weight="regular" color={p.accentText} />
    </Pressable>
  );
}
