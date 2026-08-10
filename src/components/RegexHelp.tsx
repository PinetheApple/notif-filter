import { View, Text } from 'react-native';

import {
  REGEX_EXAMPLE_ROWS,
  REGEX_HELP_NOTES,
  REGEX_SYNTAX_ROWS,
  type HelpNote,
  type HelpRow,
} from '@/constants/regexHelp';

function SectionHeading({ label }: { label: string }) {
  return (
    <Text className="text-xs font-medium text-muted dark:text-muted-dark">{label}</Text>
  );
}

function Note({ note }: { note: HelpNote }) {
  return (
    <View className="gap-0.5">
      <Text className="text-sm font-medium text-surface-dark dark:text-white">{note.title}</Text>
      <Text className="text-sm text-muted dark:text-muted-dark">{note.body}</Text>
    </View>
  );
}

function TokenRow({ row }: { row: HelpRow }) {
  return (
    <View className="flex-row items-start gap-3">
      <Text
        selectable
        className="w-32 rounded bg-surface-secondary px-2 py-1 font-mono text-xs text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
      >
        {row.token}
      </Text>
      <Text className="flex-1 pt-1 text-sm text-muted dark:text-muted-dark">{row.meaning}</Text>
    </View>
  );
}

function TokenTable({ rows }: { rows: readonly HelpRow[] }) {
  return (
    <View className="gap-2">
      {rows.map((row) => (
        <TokenRow key={row.token} row={row} />
      ))}
    </View>
  );
}

/** Reference content shared by the rule editor disclosure and the Settings page. */
export function RegexHelp() {
  return (
    <View className="gap-5">
      <View className="gap-3">
        <SectionHeading label="How matching works" />
        {REGEX_HELP_NOTES.map((note) => (
          <Note key={note.title} note={note} />
        ))}
      </View>

      <View className="gap-2">
        <SectionHeading label="Syntax" />
        <TokenTable rows={REGEX_SYNTAX_ROWS} />
      </View>

      <View className="gap-2">
        <SectionHeading label="Examples" />
        <Text className="text-sm text-muted dark:text-muted-dark">
          Press and hold a pattern to select and copy it.
        </Text>
        <TokenTable rows={REGEX_EXAMPLE_ROWS} />
      </View>
    </View>
  );
}
