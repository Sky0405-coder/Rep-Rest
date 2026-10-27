import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.tint }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.workouts'), tabBarIcon: icon('barbell-outline') }} />
      <Tabs.Screen name="library" options={{ title: t('tabs.library'), tabBarIcon: icon('list-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
