import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f4f4f5",
          tertiary: "#e4e4e7",
          dark: "#09090b",
          "dark-secondary": "#18181b",
          "dark-tertiary": "#27272a",
        },
        muted: {
          DEFAULT: "#52525b",
          dark: "#a1a1aa",
        },
        accent: {
          // amber-700 as base: white text on amber-600 fails WCAG (3.2:1)
          DEFAULT: "#b45309",
          dark: "#f59e0b",
          pressed: {
            DEFAULT: "#92400e",
            dark: "#d97706",
          },
          text: {
            DEFAULT: "#ffffff",
            dark: "#09090b",
          },
        },
      },
      spacing: {
        half: "2",
      },
      borderRadius: {
        DEFAULT: "8",
      },
    },
  },
  plugins: [],
};

export default config;
