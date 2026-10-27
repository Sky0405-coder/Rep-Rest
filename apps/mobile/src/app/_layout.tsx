import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { useAppStore } from '@/data/app-store';
// Initialisiert i18next beim Import.
import { applyLanguage } from '@/i18n';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const ready = useAppStore((s) => s.ready);
  const language = useAppStore((s) => s.settings.language);

  useEffect(() => {
    void useAppStore.getState().init().finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => applyLanguage(language), [language]);

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackTitle: t('common.back') }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: '' }} />
        <Stack.Screen name="workout/edit/[id]" options={{ title: '' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="import" options={{ title: t('import.title'), presentation: 'modal' }} />
        <Stack.Screen
          name="player/[id]"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
