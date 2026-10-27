import { flatten, localize, summarize } from '@workout/core';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { catalog } from '@/data/catalog';
import { formatDuration, useLocale } from '@/i18n';

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const items = useMemo(
    () =>
      catalog.listWorkouts().map((w) => ({
        workout: w,
        summary: summarize(flatten(w.blocks, { getExercise: catalog.getExercise })),
      })),
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.workout.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: { workout, summary } }) => (
          <Card onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}>
            <ThemedText type="smallBold">{localize(workout.name, locale)}</ThemedText>
            {workout.description && (
              <ThemedText type="small" themeColor="textSecondary">
                {localize(workout.description, locale)}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {formatDuration(summary.totalSeconds, t)} · {t('workouts.exercises', { count: summary.exerciseSteps })}
            </ThemedText>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.three },
});
