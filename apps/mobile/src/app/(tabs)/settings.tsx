import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { systemLocale } from '@/i18n';

const options = [
  { value: 'system', label: 'settings.system' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
] as const;

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  // TODO(Phase 1): Auswahl dauerhaft speichern.
  const current = i18n.language;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">{t('settings.language')}</ThemedText>
      <ThemedView type="backgroundElement" style={styles.group}>
        {options.map((o) => {
          const lng = o.value === 'system' ? systemLocale() : o.value;
          const selected = o.value !== 'system' && current === o.value;
          return (
            <Pressable key={o.value} onPress={() => i18n.changeLanguage(lng)} style={styles.row}>
              <ThemedText>{o.value === 'system' ? t(o.label) : o.label}</ThemedText>
              {selected && <ThemedText themeColor="tint">✓</ThemedText>}
            </Pressable>
          );
        })}
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '?' })}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  group: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.three },
});
