import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useAppStore, type LanguageSetting } from '@/data/app-store';
import { useTheme } from '@/hooks/use-theme';

const languages: { value: LanguageSetting; label: string }[] = [
  { value: 'system', label: 'settings.system' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold">{t('settings.language')}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.group}>
          {languages.map((o) => (
            <Pressable key={o.value} onPress={() => update({ language: o.value })} style={styles.row}>
              <ThemedText>{o.value === 'system' ? t(o.label) : o.label}</ThemedText>
              {settings.language === o.value && <ThemedText themeColor="tint">✓</ThemedText>}
            </Pressable>
          ))}
        </ThemedView>

        <ThemedText type="smallBold">{t('settings.training')}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.group}>
          <View style={styles.row}>
            <ThemedText>{t('settings.leadIn')}</ThemedText>
            <Stepper
              value={settings.leadInSeconds}
              min={0}
              max={30}
              step={(v, dir) => (v + (dir === 1 ? 0 : -1) < 5 ? 1 : 5)}
              format={(v) => (v === 0 ? t('settings.off') : `${v} s`)}
              onChange={(v) => update({ leadInSeconds: v })}
            />
          </View>
          <View style={styles.row}>
            <ThemedText>{t('settings.sound')}</ThemedText>
            <Switch value={settings.sound} onValueChange={(v) => update({ sound: v })} trackColor={{ true: theme.tint }} />
          </View>
          <View style={styles.row}>
            <ThemedText>{t('settings.vibration')}</ThemedText>
            <Switch value={settings.vibration} onValueChange={(v) => update({ vibration: v })} trackColor={{ true: theme.tint }} />
          </View>
        </ThemedView>

        <View style={styles.about}>
          <ThemedText type="smallBold">{'Rep & Rest'}</ThemedText>
          <ThemedText type="small">
            <ThemedText type="small" style={{ color: Brand.rep }}>
              Drill
            </ThemedText>
            {' & '}
            <ThemedText type="small" style={{ color: Brand.rest }}>
              Destress
            </ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.version', { version: Constants.expoConfig?.version ?? '?' })}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  group: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, gap: Spacing.two },
  about: { alignItems: 'center', gap: 2, marginTop: Spacing.three },
});
