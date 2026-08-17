import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { ClockCounterClockwise, FadersHorizontal, Gear } from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';

import { PermissionBanner } from '@/components/PermissionBanner';
import { palette, COLORS } from '@/constants/colors';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  // Top inset lives here (not in each tab screen) so the permission banner
  // clears the status bar under Android 16 edge-to-edge.
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-surface-dark">
      <PermissionBanner scheme={scheme} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: p.text,
          tabBarInactiveTintColor: p.muted,
          tabBarStyle: {
            borderTopColor:
              scheme === 'dark' ? COLORS.surface.darkTertiary : COLORS.surface.tertiary,
            backgroundColor: scheme === 'dark' ? COLORS.surface.dark : COLORS.surface.DEFAULT,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Rules',
            tabBarIcon: ({ color, size, focused }) => (
              <FadersHorizontal
                color={String(color)}
                size={size}
                weight={focused ? 'bold' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size, focused }) => (
              <ClockCounterClockwise
                color={String(color)}
                size={size}
                weight={focused ? 'bold' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Gear color={String(color)} size={size} weight={focused ? 'bold' : 'regular'} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
