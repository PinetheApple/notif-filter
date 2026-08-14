import { View, Text } from 'react-native';

const SURFACE_STYLES = {
  allow: 'bg-success-surface dark:bg-success-surface-dark',
  deny: 'bg-warning-surface dark:bg-warning-surface-dark',
  neutral: 'bg-surface-secondary dark:bg-surface-dark-secondary',
};

const TEXT_STYLES = {
  allow: 'text-success dark:text-success-dark',
  deny: 'text-warning dark:text-warning-dark',
  neutral: 'text-muted dark:text-muted-dark',
};

export function Badge({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: 'allow' | 'deny' | 'neutral';
}) {
  return (
    <View className={`rounded px-2 py-0.5 ${SURFACE_STYLES[variant]}`}>
      <Text className={`text-xs font-medium ${TEXT_STYLES[variant]}`}>{label}</Text>
    </View>
  );
}
