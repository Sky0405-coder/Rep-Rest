import { localize } from '@workout/core';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { catalog } from '@/data/catalog';
import { formatDuration, useLocale } from '@/i18n';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={catalog.listExercises()}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: e }) => (
          <Card>
            <ThemedText type="smallBold">{localize(e.name, locale)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {e.defaults.mode === 'reps' && e.defaults.reps
                ? t('step.reps', { count: e.defaults.reps })
                : formatDuration(e.defaults.duration ?? 30, t)}
              {e.sides === 'left_right' ? ` · ${t('step.left')}/${t('step.right')}` : ''}
              {e.tags.length > 0 ? ` · ${e.tags.join(', ')}` : ''}
            </ThemedText>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
});
