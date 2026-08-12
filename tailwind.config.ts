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
          DEFAULT: '#52525b',
          dark: '#a1a1aa',
        },
        accent: {
          // amber-700 as base: white text on amber-600 fails WCAG (3.2:1)
          DEFAULT: '#b45309',
          dark: '#f59e0b',
          pressed: {
            DEFAULT: '#92400e',
            dark: '#d97706',
          },
          text: {
            DEFAULT: '#ffffff',
            dark: '#09090b',
          },
        },
        success: {
          // green-700 over the green-100 surface is 4.57:1; green-600 fails at 3.4:1
          DEFAULT: '#15803d',
          dark: '#86efac',
          surface: {
            DEFAULT: '#dcfce7',
            dark: '#14532d',
          },
        },
        warning: {
          DEFAULT: '#92400e',
          dark: '#fde68a',
          // Secondary tone for banner body text: 4.51:1 on the light surface,
          // 6.29:1 on the dark one.
          muted: {
            DEFAULT: '#b45309',
            dark: '#fcd34d',
          },
          surface: {
            DEFAULT: '#fef3c7',
            dark: '#78350f',
          },
        },
        danger: {
          DEFAULT: '#dc2626',
          dark: '#f87171',
          surface: {
            DEFAULT: '#fef2f2',
            dark: '#450a0a',
          },
        },
      },
      fontSize: {
        '2xs': '11px',
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
