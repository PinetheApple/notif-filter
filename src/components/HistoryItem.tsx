import { View, Text, Image, Pressable } from "react-native";
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
  PlusCircle,
  Prohibit,
} from "phosphor-react-native";

import { Badge } from "@/components/ui";
import { palette } from "@/constants/colors";
import type { HistoryEntry } from "../../modules/notif-filter/src/index";

const BODY_PREVIEW_LINES = 2;
const CARET_SIZE = 14;
const META_SEPARATOR = " · ";

/** Body length past which the collapsed preview is likely cutting text off. */
const PREVIEW_OVERFLOW_LENGTH = 120;

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
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
  variant: "allow" | "deny";
} {
  if (entry.disposition === "blocked") {
    const rule = entry.ruleLabel ?? entry.ruleId;
    const suffix = rule ? ` by "${rule}"` : " by default policy";
    return { text: `Blocked${suffix}`, variant: "deny" };
  }
  const rule = entry.ruleLabel ?? entry.ruleId;
  const suffix = rule ? ` by "${rule}"` : " — no rules matched";
  return { text: `Allowed${suffix}`, variant: "allow" };
}

/** The long-form body, when it says more than the collapsed `text` line already does. */
function expandedBody(entry: HistoryEntry): string {
  const big = entry.bigText ?? "";
  return big && big !== entry.text ? big : "";
}

/** Ancillary labels (sub/summary/info), deduplicated into one muted line. */
function metaLine(entry: HistoryEntry): string {
  const parts = [entry.subText, entry.summaryText, entry.infoText].filter(
    (part): part is string => Boolean(part),
  );
  return Array.from(new Set(parts)).join(META_SEPARATOR);
}

function extraLines(entry: HistoryEntry): string {
  const lines = entry.textLines ?? "";
  return lines && lines !== entry.text && lines !== expandedBody(entry)
    ? lines
    : "";
}

function hasDetail(entry: HistoryEntry): boolean {
  return Boolean(
    expandedBody(entry) ||
    extraLines(entry) ||
    metaLine(entry) ||
    entry.text.length > PREVIEW_OVERFLOW_LENGTH,
  );
}

export function HistoryItem({
  entry,
  scheme,
  expanded,
  onToggleExpand,
  onRestore,
  onBlockApp,
  onAllowApp,
}: {
  entry: HistoryEntry;
  scheme: "light" | "dark";
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onRestore: (id: string) => void;
  onBlockApp: (pkg: string, appLabel: string) => void;
  onAllowApp: (pkg: string, appLabel: string) => void;
}) {
  const p = palette(scheme);
  const disp = dispositionLabel(entry);
  const expandable = hasDetail(entry);
  const Caret = expanded ? CaretUp : CaretDown;
  const body = expandedBody(entry);
  const lines = extraLines(entry);
  const meta = metaLine(entry);

  function handleToggleExpand() {
    onToggleExpand(entry.id);
  }

  function handleRestore() {
    onRestore(entry.id);
  }

  function handleBlockApp() {
    onBlockApp(entry.package, entry.appLabel);
  }

  function handleAllowApp() {
    onAllowApp(entry.package, entry.appLabel);
  }

  return (
    <View className="mx-4 rounded-lg bg-white px-4 py-3 dark:bg-surface-dark">
      <Pressable
        onPress={handleToggleExpand}
        disabled={!expandable}
        className="flex-row items-start gap-3"
      >
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
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-muted dark:text-muted-dark">
                {relativeTime(entry.timestamp)}
              </Text>
              {expandable ? (
                <Caret size={CARET_SIZE} weight="regular" color={p.muted} />
              ) : null}
            </View>
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

          {/* Body — clamped until the row is expanded */}
          {entry.text ? (
            <Text
              className="text-sm text-muted dark:text-muted-dark"
              numberOfLines={expanded ? undefined : BODY_PREVIEW_LINES}
            >
              {entry.text}
            </Text>
          ) : null}

          {/* Everything else captured from the notification */}
          {expanded ? (
            <View className="gap-1 border-l-2 border-surface-secondary pl-2 dark:border-surface-dark-secondary">
              {body ? (
                <Text className="text-sm text-surface-dark dark:text-white">
                  {body}
                </Text>
              ) : null}
              {lines ? (
                <Text className="text-sm text-surface-dark dark:text-white">
                  {lines}
                </Text>
              ) : null}
              {meta ? (
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {meta}
                </Text>
              ) : null}
            </View>
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
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={disp.text} variant={disp.variant} />
            {entry.recovered ? (
              <Badge label="Recovered" variant="neutral" />
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Actions */}
      <View className="mt-2 flex-row gap-2 border-t border-surface-secondary pt-2 dark:border-surface-dark-secondary">
        {entry.disposition === "blocked" ? (
          <Pressable
            onPress={handleRestore}
            className="flex-row items-center gap-1 rounded px-2 py-1 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
          >
            <ArrowCounterClockwise size={14} weight="regular" color={p.muted} />
            <Text className="text-xs text-muted dark:text-muted-dark">
              Restore
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleBlockApp}
          className="flex-row items-center gap-1 rounded px-2 py-1 active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <Prohibit size={14} weight="regular" color={p.muted} />
          <Text className="text-xs text-muted dark:text-muted-dark">
            Block app
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAllowApp}
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
