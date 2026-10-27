import { localize } from '@workout/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FigureView } from '@/components/figure-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getExercise } from '@/data/catalog';
import { exerciseDefaultLabel } from '@/data/labels';
import { useTheme } from '@/hooks/use-theme';
import { tagLabel, useLocale } from '@/i18n';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  const e = getExercise(id);
  if (!e) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: localize(e.name, locale) }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.figure}>
          <FigureView figure={e.media.figure} size={240} color={theme.tint} mutedColor={theme.backgroundSelected} animate />
        </View>
        {e.description && <ThemedText>{localize(e.description, locale)}</ThemedText>}
        <ThemedText type="small" themeColor="textSecondary">
          {t('exercise.defaults')}: {exerciseDefaultLabel(e, t)}
          {e.sides === 'left_right' ? ` · ${t('step.left')}/${t('step.right')}` : ''}
        </ThemedText>
        {e.cues.length > 0 && (
          <View style={styles.cues}>
            <ThemedText type="smallBold">{t('exercise.cues')}</ThemedText>
            {e.cues.map((c, i) => (
              <ThemedText key={i}>• {localize(c, locale)}</ThemedText>
            ))}
          </View>
        )}
        {e.tags.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {e.tags.map((tag) => tagLabel(tag, t)).join(' · ')}
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  figure: { alignItems: 'center' },
  cues: { gap: Spacing.one },
});
