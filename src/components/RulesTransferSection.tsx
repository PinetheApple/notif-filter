import { useState } from 'react';
import { View, Text, Pressable, TextInput, Share } from 'react-native';
import { Export, FileArrowDown } from 'phosphor-react-native';

import { ListRow, ListSection, Separator } from '@/components/ui';
import { useRulesStore, type Rule } from '@/stores/rules';
import { palette, type ColorScheme } from '@/constants/colors';

const ICON_SIZE = 16;
const EXPORT_TITLE = 'NotifFilter rules export';

export type Notice = { title: string; message: string };

const NOTICE_INVALID_FORMAT: Notice = {
  title: 'Invalid format',
  message: 'The pasted text is not a valid rules export.',
};

const NOTICE_INVALID_JSON: Notice = {
  title: 'Invalid JSON',
  message: 'Could not parse the pasted text.',
};

type Props = {
  scheme: ColorScheme;
  onNotice: (notice: Notice) => void;
};

export function RulesTransferSection({ scheme, onNotice }: Props) {
  const p = palette(scheme);
  const rules = useRulesStore((s) => s.rules);
  const importRules = useRulesStore((s) => s.importRules);

  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState('');

  function handleExport() {
    const json = JSON.stringify(rules, null, 2);
    Share.share({ message: json, title: EXPORT_TITLE });
  }

  function handleImportTap() {
    setImportVisible(!importVisible);
    setImportJson('');
  }

  function handleImportExecute(mode: 'merge' | 'replace') {
    try {
      const parsed: Rule[] = JSON.parse(importJson);
      if (!Array.isArray(parsed) || !parsed.every((r) => r.id && r.pattern)) {
        onNotice(NOTICE_INVALID_FORMAT);
        return;
      }
      importRules(
        parsed.map((r) => ({ ...r, updatedAt: r.updatedAt ?? Date.now() })),
        mode,
      );
      setImportVisible(false);
      setImportJson('');
    } catch {
      onNotice(NOTICE_INVALID_JSON);
    }
  }

  function handleImportReplace() {
    handleImportExecute('replace');
  }

  function handleImportMerge() {
    handleImportExecute('merge');
  }

  return (
    <ListSection>
      <ListRow
        label="Export rules"
        description={`${rules.length} rule${rules.length === 1 ? '' : 's'} as JSON`}
        action={
          <Pressable onPress={handleExport} className="flex-row items-center gap-1">
            <Export size={ICON_SIZE} weight="regular" color={p.muted} />
          </Pressable>
        }
      />
      <Separator />
      <ListRow
        label="Import rules"
        description="Paste JSON from a previous export"
        action={
          <Pressable onPress={handleImportTap} className="flex-row items-center gap-1">
            <FileArrowDown size={ICON_SIZE} weight="regular" color={p.muted} />
          </Pressable>
        }
      />
      {importVisible ? (
        <View className="gap-2 px-4 pb-3">
          <TextInput
            value={importJson}
            onChangeText={setImportJson}
            placeholder="Paste exported JSON here"
            placeholderTextColor={p.muted}
            multiline
            className="h-24 rounded bg-surface-secondary p-2 text-xs text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleImportReplace}
              className="flex-1 rounded bg-accent px-3 py-1.5 active:bg-accent-pressed dark:bg-accent-dark dark:active:bg-accent-pressed-dark"
            >
              <Text className="text-center text-xs font-medium text-accent-text dark:text-accent-text-dark">
                Replace all
              </Text>
            </Pressable>
            <Pressable
              onPress={handleImportMerge}
              className="flex-1 rounded bg-surface-secondary px-3 py-1.5 active:bg-surface-tertiary dark:bg-surface-dark-secondary dark:active:bg-surface-dark-tertiary"
            >
              <Text className="text-center text-xs font-medium text-surface-dark dark:text-white">
                Merge
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ListSection>
  );
}
