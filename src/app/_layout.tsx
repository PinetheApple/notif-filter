import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

import '@/global.css';

const NAV_LIGHT = {
  dark: false,
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
  colors: {
    primary: '#18181b',
    background: '#ffffff',
    card: '#ffffff',
    text: '#18181b',
    border: '#e4e4e7',
    notification: '#d97706',
  },
};

const NAV_DARK = {
  dark: true,
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
  colors: {
    primary: '#fafafa',
    background: '#09090b',
    card: '#09090b',
    text: '#fafafa',
    border: '#27272a',
    notification: '#f59e0b',
  },
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <NavThemeProvider value={scheme === 'dark' ? NAV_DARK : NAV_LIGHT}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}
