import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

import "@/global.css";
import { usePermissionStore } from "@/stores/permissions";
import { useRulesStore } from "@/stores/rules";
import { useSettingsStore } from "@/stores/settings";
import { COLORS } from "@/constants/colors";

const NAV_LIGHT = {
  dark: false,
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "500" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "900" as const },
  },
  colors: {
    primary: COLORS.text.light,
    background: COLORS.surface.DEFAULT,
    card: COLORS.surface.DEFAULT,
    text: COLORS.text.light,
    border: COLORS.surface.tertiary,
    notification: COLORS.accent.DEFAULT,
  },
};

const NAV_DARK = {
  dark: true,
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "500" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "900" as const },
  },
  colors: {
    primary: COLORS.text.dark,
    background: COLORS.surface.dark,
    card: COLORS.surface.dark,
    text: COLORS.text.dark,
    border: COLORS.surface.darkTertiary,
    notification: COLORS.accent.dark,
  },
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const checkPermission = usePermissionStore((s) => s.checkPermission);
  const loadRules = useRulesStore((s) => s.loadFromNative);
  const loadSettings = useSettingsStore((s) => s.loadFromNative);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    loadRules();
    loadSettings();
    // Apply persisted theme on boot (NativeWind defaults to system otherwise)
    const tp = useSettingsStore.getState().themePreference;
    if (tp !== 'system') {
      setColorScheme(tp);
    }
    checkPermission();
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        checkPermission();
      }
    });
    return () => sub.remove();
  }, [checkPermission, loadRules, loadSettings]);

  return (
    <NavThemeProvider value={scheme === "dark" ? NAV_DARK : NAV_LIGHT}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </NavThemeProvider>
  );
}
