import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

import { RuleForm } from "@/components/RuleForm";

export default function NewRuleScreen() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark">
      <RuleForm scheme={scheme} />
    </SafeAreaView>
  );
}
