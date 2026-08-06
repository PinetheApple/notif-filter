import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { ClockCounterClockwise, FadersHorizontal, Gear } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { PermissionBanner } from '@/components/PermissionBanner';

const COLORS = {
  light: { active: '#18181b', inactive: '#a1a1aa' },
  dark: { active: '#fafafa', inactive: '#71717a' },
};

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = COLORS[scheme];

  return (
    <View className="flex-1">
      <PermissionBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.active,
          tabBarInactiveTintColor: palette.inactive,
          tabBarStyle: {
            borderTopColor: scheme === 'dark' ? '#27272a' : '#e4e4e7',
            backgroundColor: scheme === 'dark' ? '#09090b' : '#ffffff',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Rules',
            tabBarIcon: ({ color, size }) => (
              <FadersHorizontal color={String(color)} size={size} weight="regular" />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <ClockCounterClockwise color={String(color)} size={size} weight="regular" />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Gear color={String(color)} size={size} weight="regular" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
