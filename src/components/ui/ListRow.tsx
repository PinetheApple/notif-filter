import { View, Text } from 'react-native';

export function ListRow({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-base text-surface-dark dark:text-white">
          {label}
        </Text>
        {description ? (
          <Text className="text-sm text-muted dark:text-muted-dark">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function ListSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="mx-4 mb-6 overflow-hidden rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary">
      {children}
    </View>
  );
}
