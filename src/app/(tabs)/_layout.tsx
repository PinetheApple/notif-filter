import { View } from "react-native";
import { Tabs } from "expo-router";
import {
  ClockCounterClockwise,
  FadersHorizontal,
  Gear,
} from "phosphor-react-native";
import { useColorScheme } from "nativewind";

import { PermissionBanner } from "@/components/PermissionBanner";
import { palette, COLORS } from "@/constants/colors";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const p = palette(scheme);

  return (
    <View className="flex-1">
      <PermissionBanner scheme={scheme} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: p.text,
          tabBarInactiveTintColor: p.muted,
          tabBarStyle: {
            borderTopColor:
              scheme === "dark"
                ? COLORS.surface.darkTertiary
                : COLORS.surface.tertiary,
            backgroundColor:
              scheme === "dark" ? COLORS.surface.dark : COLORS.surface.DEFAULT,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Rules",
            tabBarIcon: ({ color, size }) => (
              <FadersHorizontal
                color={String(color)}
                size={size}
                weight="regular"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <ClockCounterClockwise
                color={String(color)}
                size={size}
                weight="regular"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Gear color={String(color)} size={size} weight="regular" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
