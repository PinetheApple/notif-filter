import { View, Text, Pressable } from 'react-native';

type SegmentSize = 'sm' | 'md';

const SIZE_STYLES: Record<SegmentSize, { option: string; text: string }> = {
  sm: { option: 'px-3 py-1.5', text: 'text-xs' },
  md: { option: 'flex-1 px-3 py-2', text: 'text-sm' },
};

function identity(option: string) {
  return option;
}

type OptionProps<T extends string> = {
  option: T;
  label: string;
  active: boolean;
  size: SegmentSize;
  onSelect: (value: T) => void;
};

function SegmentOption<T extends string>({
  option,
  label,
  active,
  size,
  onSelect,
}: OptionProps<T>) {
  function handlePress() {
    onSelect(option);
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`${SIZE_STYLES[size].option} ${
        active
          ? 'bg-accent dark:bg-accent-dark'
          : 'bg-surface-secondary dark:bg-surface-dark-secondary'
      }`}
    >
      <Text
        className={`text-center font-medium ${SIZE_STYLES[size].text} ${
          active
            ? 'text-accent-text dark:text-accent-text-dark'
            : 'text-surface-dark dark:text-white'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (option: T) => string;
  size?: SegmentSize;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  formatLabel = identity,
  size = 'md',
}: Props<T>) {
  return (
    <View className="flex-row overflow-hidden rounded-lg">
      {options.map((opt) => (
        <SegmentOption
          key={opt}
          option={opt}
          label={formatLabel(opt)}
          active={opt === value}
          size={size}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}
