import { View, Text } from "react-native";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text className="text-lg font-medium text-surface-dark dark:text-white">
        {title}
      </Text>
      {description ? (
        <Text className="text-center text-base text-muted dark:text-muted-dark">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
