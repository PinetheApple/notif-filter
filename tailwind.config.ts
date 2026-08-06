import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f4f4f5',
          tertiary: '#e4e4e7',
          dark: '#09090b',
          'dark-secondary': '#18181b',
          'dark-tertiary': '#27272a',
        },
        muted: {
          DEFAULT: '#71717a',
          dark: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#d97706',
          dark: '#f59e0b',
        },
      },
      spacing: {
        half: '2',
      },
      borderRadius: {
        DEFAULT: '8',
      },
    },
  },
  plugins: [],
};

export default config;
