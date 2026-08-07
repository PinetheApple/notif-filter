import { View, Text, Image, Pressable } from 'react-native';
import { ArrowCounterClockwise, PlusCircle, Prohibit } from 'phosphor-react-native';

import { Badge } from '@/components/ui';
import { palette } from '@/constants/colors';
import type { HistoryEntry } from '../../modules/notif-filter/src/index';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function dispositionLabel(entry: HistoryEntry): {
  text: string;
  variant: 'allow' | 'deny';
} {
  if (entry.disposition === 'blocked') {
    const rule = entry.ruleLabel ?? entry.ruleId;
    const suffix = rule ? ` by "${rule}"` : ' by default policy';
    return { text: `Blocked${suffix}`, variant: 'deny' };
  }
  const rule = entry.ruleLabel ?? entry.ruleId;
  const suffix = rule ? ` by "${rule}"` : ' — no rules matched';
  return { text: `Allowed${suffix}`, variant: 'allow' };
}

export function HistoryItem({
  entry,
  scheme,
  onRestore,
  onBlockApp,
  onAllowApp,
}: {
  entry: HistoryEntry;
  scheme: 'light' | 'dark';
  onRestore: () => void;
  onBlockApp: () => void;
  onAllowApp: () => void;
}) {
  const p = palette(scheme);
  const disp = dispositionLabel(entry);

  return (
    <View className="mx-4 rounded-lg bg-white px-4 py-3 dark:bg-surface-dark">
      <View className="flex-row items-start gap-3">
        {/* App icon */}
        <View className="h-8 w-8 items-center justify-center rounded bg-surface-secondary dark:bg-surface-dark-secondary">
          <Text className="text-[10px] text-muted dark:text-muted-dark">
            {entry.appLabel.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 gap-1">
          {/* App name + time */}
          <View className="flex-row items-center justify-between">
            <Text
              className="text-sm font-medium text-surface-dark dark:text-white"
              numberOfLines={1}
            >
              {entry.appLabel || entry.package}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {relativeTime(entry.timestamp)}
            </Text>
          </View>

          {/* Title */}
          {entry.title ? (
            <Text
              className="text-sm text-surface-dark dark:text-white"
              numberOfLines={2}
            >
              {entry.title}
            </Text>
          ) : null}

          {/* Matched segment */}
          {entry.matchedSegment ? (
            <Text
              className="font-mono text-xs text-accent dark:text-accent-dark"
              numberOfLines={1}
            >
              matched: {entry.matchedSegment}
            </Text>
          ) : null}

          {/* Disposition */}
          <View className="flex-row items-center gap-2">
            <Badge label={disp.text} variant={disp.variant} />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="mt-2 flex-row gap-2 border-t border-surface-secondary pt-2 dark:border-surface-dark-secondary">
        {entry.disposition === 'blocked' ? (
          <Pressable
            onPress={onRestore}
            className="flex-row items-center gap-1 rounded px-2 py-1 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
          >
            <ArrowCounterClockwise size={14} weight="regular" color={p.muted} />
            <Text className="text-xs text-muted dark:text-muted-dark">
              Restore
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onBlockApp}
          className="flex-row items-center gap-1 rounded px-2 py-1 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <Prohibit size={14} weight="regular" color={p.muted} />
          <Text className="text-xs text-muted dark:text-muted-dark">
            Block app
          </Text>
        </Pressable>
        <Pressable
          onPress={onAllowApp}
          className="flex-row items-center gap-1 rounded px-2 py-1 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <PlusCircle size={14} weight="regular" color={p.muted} />
          <Text className="text-xs text-muted dark:text-muted-dark">
            Allow app
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
