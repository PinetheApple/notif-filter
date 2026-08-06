import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { CaretLeft, CaretRight } from "phosphor-react-native";

import { useRulesStore, type Rule, type RuleAction } from "@/stores/rules";
import { usePickerStore } from "@/stores/picker";
import { palette, COLORS } from "@/constants/colors";
import * as NotifFilter from "../../modules/notif-filter/src/index";

type Props = {
  initialRule?: Rule;
  scheme: "light" | "dark";
};

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row overflow-hidden rounded-lg">
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          className={`flex-1 px-3 py-2 ${
            opt === value
              ? "bg-accent"
              : "bg-surface-secondary dark:bg-surface-dark-secondary"
          }`}
        >
          <Text
            className={`text-center text-sm font-medium ${
              opt === value
                ? "text-accent-text"
                : "text-surface-dark dark:text-white"
            }`}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function RuleForm({ initialRule, scheme }: Props) {
  const router = useRouter();
  const p = palette(scheme);

  const addRule = useRulesStore((s) => s.addRule);
  const updateRule = useRulesStore((s) => s.updateRule);
  const selected = usePickerStore((s) => s.selected);

  const isEdit = !!initialRule;
  const [label, setLabel] = useState(initialRule?.label ?? "");
  const [pattern, setPattern] = useState(initialRule?.pattern ?? "");
  const [caseInsensitive, setCaseInsensitive] = useState(
    initialRule?.caseInsensitive ?? false,
  );
  const [field, setField] = useState<"title" | "text" | "any">(
    initialRule?.field ?? "any",
  );
  const [action, setAction] = useState<RuleAction>(
    initialRule?.action ?? "deny",
  );
  const [scopeType, setScopeType] = useState<"all" | "packages">(
    initialRule?.scopeType ?? "all",
  );
  const [scopePackages, setScopePackages] = useState<string[]>(
    initialRule?.scopePackages ?? [],
  );

  const [sampleText, setSampleText] = useState("");
  const [testResult, setTestResult] = useState<{
    matches: boolean;
    matchedSegment: string;
  } | null>(null);

  const runTest = useCallback((patt: string, ci: boolean, sample: string) => {
    if (!patt || !sample) {
      setTestResult(null);
      return;
    }
    try {
      const result = NotifFilter.testPattern(patt, ci, sample, "");
      setTestResult(result);
    } catch {
      setTestResult(null);
    }
  }, []);

  function handlePatternChange(text: string) {
    setPattern(text);
    runTest(text, caseInsensitive, sampleText);
  }

  function handleCaseInsensitiveChange(v: boolean) {
    setCaseInsensitive(v);
    runTest(pattern, v, sampleText);
  }

  function handleSampleChange(text: string) {
    setSampleText(text);
    runTest(pattern, caseInsensitive, text);
  }

  useFocusEffect(
    useCallback(() => {
      if (scopeType === "packages") {
        setScopePackages(usePickerStore.getState().selected);
      }
    }, [scopeType]),
  );

  function openAppPicker() {
    usePickerStore
      .getState()
      .setSelected(scopeType === "packages" ? scopePackages : []);
    router.push("/picker");
  }

  function handleSave() {
    const packages =
      scopeType === "packages"
        ? selected.length > 0
          ? selected
          : scopePackages
        : [];

    if (isEdit && initialRule) {
      updateRule(initialRule.id, {
        label,
        pattern,
        caseInsensitive,
        field,
        action,
        scopeType,
        scopePackages: packages,
      });
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      addRule({
        id,
        label,
        enabled: true,
        pattern,
        caseInsensitive,
        field,
        action,
        scopeType,
        scopePackages: packages,
        updatedAt: Date.now(),
      });
    }
    router.back();
  }

  const canSave = pattern.trim().length > 0;

  return (
    <View className="flex-1 bg-white dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-2 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary dark:active:bg-surface-dark-secondary"
        >
          <CaretLeft size={22} weight="regular" color={p.text} />
        </Pressable>
        <Text className="flex-1 text-lg font-medium text-surface-dark dark:text-white">
          {isEdit ? "Edit rule" : "New rule"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-lg px-4 py-2 ${
            canSave
              ? "bg-accent active:bg-amber-600"
              : "bg-surface-secondary dark:bg-surface-dark-secondary"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              canSave ? "text-accent-text" : "text-muted dark:text-muted-dark"
            }`}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <View className="mt-4 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            Label (optional)
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Block promo emails"
            placeholderTextColor={p.muted}
            className="rounded-lg bg-surface-secondary px-3 py-2.5 text-sm text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
          />
        </View>

        <View className="mt-5 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            App scope
          </Text>
          <Segment
            options={["all", "packages"] as const}
            value={scopeType}
            onChange={(v) => setScopeType(v)}
          />
          {scopeType === "packages" ? (
            <Pressable
              onPress={openAppPicker}
              className="mt-2 flex-row items-center justify-between rounded-lg bg-surface-secondary px-3 py-2.5 dark:bg-surface-dark-secondary"
            >
              <Text className="text-sm text-surface-dark dark:text-white">
                {scopePackages.length > 0
                  ? `${scopePackages.length} app${scopePackages.length === 1 ? "" : "s"} selected`
                  : "Choose apps"}
              </Text>
              <CaretRight size={16} weight="regular" color={p.muted} />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-5 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            Match field
          </Text>
          <Segment
            options={["title", "text", "any"] as const}
            value={field}
            onChange={(v) => setField(v)}
          />
        </View>

        <View className="mt-5 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            Pattern (Java regex)
          </Text>
          <TextInput
            value={pattern}
            onChangeText={handlePatternChange}
            placeholder="e.g. promo|sale|discount"
            placeholderTextColor={p.muted}
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-lg bg-surface-secondary px-3 py-2.5 font-mono text-sm text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
          />
          <View className="mt-2 flex-row items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 dark:bg-surface-dark-secondary">
            <Text className="text-sm text-surface-dark dark:text-white">
              Case insensitive
            </Text>
            <Switch
              value={caseInsensitive}
              onValueChange={handleCaseInsensitiveChange}
              trackColor={{
                false: COLORS.switch.trackOff,
                true: COLORS.switch.trackOn,
              }}
              thumbColor={COLORS.switch.thumb}
            />
          </View>
        </View>

        <View className="mt-5 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            Action
          </Text>
          <Segment
            options={["deny", "allow"] as const}
            value={action}
            onChange={(v) => setAction(v)}
          />
        </View>

        <View className="mt-6 gap-1">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">
            Test your pattern
          </Text>
          <TextInput
            value={sampleText}
            onChangeText={handleSampleChange}
            placeholder="Paste a sample notification title to test"
            placeholderTextColor={p.muted}
            className="rounded-lg bg-surface-secondary px-3 py-2.5 text-sm text-surface-dark dark:bg-surface-dark-secondary dark:text-white"
          />
          {testResult ? (
            <View
              className={`mt-1 flex-row items-center gap-2 rounded-lg px-3 py-2 ${
                testResult.matches
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-surface-secondary dark:bg-surface-dark-secondary"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  testResult.matches
                    ? "text-green-800 dark:text-green-200"
                    : "text-muted dark:text-muted-dark"
                }`}
              >
                {testResult.matches ? "Match" : "No match"}
              </Text>
              {testResult.matches && testResult.matchedSegment ? (
                <Text
                  className="flex-1 font-mono text-xs text-green-700 dark:text-green-300"
                  numberOfLines={1}
                >
                  {testResult.matchedSegment}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
