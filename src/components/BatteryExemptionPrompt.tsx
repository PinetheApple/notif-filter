import { Dialog } from '@/components/ui';
import { usePermissionStore } from '@/stores/permissions';
import { useSettingsStore } from '@/stores/settings';
import * as NotifFilter from '../../modules/notif-filter/src/index';

/**
 * One-shot prompt for the battery-optimization exemption.
 *
 * Visibility is derived, not stored: it appears once listener access is
 * granted and the exemption is missing, and disappears permanently after a
 * choice is recorded. If the user grants and later revokes the exemption,
 * the prompt returns once — it never repeats while state is unchanged.
 */
export function BatteryExemptionPrompt() {
  const listenerEnabled = usePermissionStore((s) => s.listenerEnabled);
  const batteryExempt = usePermissionStore((s) => s.batteryExempt);
  const batteryPromptShown = useSettingsStore((s) => s.batteryPromptShown);
  const setBatteryPromptShown = useSettingsStore((s) => s.setBatteryPromptShown);

  const visible = listenerEnabled === true && batteryExempt === false && !batteryPromptShown;

  function handleDismiss() {
    setBatteryPromptShown(true);
  }

  function handleConfirm() {
    NotifFilter.requestBatteryOptimizationExemption();
  }

  return (
    <Dialog
      visible={visible}
      title="Keep the filter running"
      message="Some phones put idle apps to sleep, which can silently stop filtering. Exempt NotifFilter from battery optimization to keep it working — the app does no background work of its own."
      confirmLabel="Exempt"
      onConfirm={handleConfirm}
      onDismiss={handleDismiss}
    />
  );
}
