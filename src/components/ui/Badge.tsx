import { View, Text } from 'react-native';

export function Badge({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: 'allow' | 'deny' | 'neutral';
}) {
  const styles = {
    allow: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    deny: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    neutral:
      'bg-surface-secondary dark:bg-surface-dark-secondary text-muted dark:text-muted-dark',
  };

  return (
    <View className={`rounded-md px-2 py-0.5 ${styles[variant]}`}>
      <Text
        className={`text-xs font-medium ${
          variant === 'allow'
            ? 'text-green-800 dark:text-green-200'
            : variant === 'deny'
              ? 'text-amber-800 dark:text-amber-200'
              : 'text-muted dark:text-muted-dark'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
