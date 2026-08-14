import { View, Text, Modal, Pressable } from 'react-native';

const ACKNOWLEDGE_LABEL = 'OK';
const CANCEL_LABEL = 'Cancel';

type ButtonVariant = 'neutral' | 'accent' | 'destructive';

const BUTTON_STYLES: Record<ButtonVariant, { surface: string; text: string }> = {
  neutral: {
    surface:
      'bg-surface-secondary active:bg-surface-tertiary dark:bg-surface-dark-tertiary dark:active:bg-surface-dark-secondary',
    text: 'text-surface-dark dark:text-white',
  },
  accent: {
    surface:
      'bg-accent active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark',
    text: 'text-accent-text dark:text-accent-text-dark',
  },
  // No pressed token exists for danger, so the press state is an opacity shift.
  destructive: {
    surface: 'bg-danger active:opacity-80 dark:bg-danger-dark',
    text: 'text-white dark:text-surface-dark',
  },
};

type ButtonProps = {
  label: string;
  variant: ButtonVariant;
  onPress: () => void;
};

function DialogButton({ label, variant, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} className={`rounded px-4 py-2 ${BUTTON_STYLES[variant].surface}`}>
      <Text className={`text-sm font-medium ${BUTTON_STYLES[variant].text}`}>{label}</Text>
    </Pressable>
  );
}

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
};

export function Dialog({
  visible,
  title,
  message,
  onDismiss,
  confirmLabel,
  onConfirm,
  destructive = false,
}: Props) {
  function handleConfirm() {
    onDismiss();
    onConfirm?.();
  }

  // Swallow the press so a tap inside the card does not reach the dismissing scrim.
  function handleCardPress() {}

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} className="flex-1 justify-center bg-black/50 px-8">
        <Pressable
          onPress={handleCardPress}
          className="gap-2 rounded-lg bg-white p-5 dark:bg-surface-dark-secondary"
        >
          <Text className="text-lg font-medium text-surface-dark dark:text-white">{title}</Text>
          <Text className="text-base text-muted dark:text-muted-dark">{message}</Text>

          <View className="mt-3 flex-row justify-end gap-2">
            {onConfirm ? (
              <>
                <DialogButton label={CANCEL_LABEL} variant="neutral" onPress={onDismiss} />
                <DialogButton
                  label={confirmLabel ?? ACKNOWLEDGE_LABEL}
                  variant={destructive ? 'destructive' : 'accent'}
                  onPress={handleConfirm}
                />
              </>
            ) : (
              <DialogButton label={ACKNOWLEDGE_LABEL} variant="neutral" onPress={onDismiss} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
