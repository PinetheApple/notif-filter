/**
 * Color constants derived from the design token values in tailwind.config.ts.
 * Used for React Native props (Switch, Phosphor icons) that cannot accept className.
 */
export const COLORS = {
  surface: {
    DEFAULT: "#ffffff",
    secondary: "#f4f4f5",
    tertiary: "#e4e4e7",
    dark: "#09090b",
    darkSecondary: "#18181b",
    darkTertiary: "#27272a",
  },
  text: {
    light: "#18181b",
    dark: "#fafafa",
  },
  muted: {
    light: "#52525b",
    dark: "#a1a1aa",
  },
  accent: {
    DEFAULT: "#b45309",
    dark: "#f59e0b",
  },
  destructive: {
    light: "#dc2626",
    dark: "#f87171",
  },
  switch: {
    trackOff: "#d4d4d8",
    trackOn: "#b45309",
    thumb: "#ffffff",
  },
} as const;

export type ColorScheme = "light" | "dark";

export function palette(scheme: ColorScheme) {
  return {
    text: scheme === "dark" ? COLORS.text.dark : COLORS.text.light,
    muted: scheme === "dark" ? COLORS.muted.dark : COLORS.muted.light,
    accent: scheme === "dark" ? COLORS.accent.dark : COLORS.accent.DEFAULT,
    accentText:
      scheme === "dark" ? COLORS.surface.dark : COLORS.surface.DEFAULT,
    destructive:
      scheme === "dark" ? COLORS.destructive.dark : COLORS.destructive.light,
  };
}
