import { flatten, localize, summarize, type Step } from '@workout/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { catalog } from '@/data/catalog';
import { formatDuration, useLocale } from '@/i18n';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const workout = catalog.getWorkout(id);
  const steps = useMemo(
    () => (workout ? flatten(workout.blocks, { getExercise: catalog.getExercise }) : []),
    [workout],
  );

  if (!workout) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{t('workouts.notFound')}</ThemedText>
      </ThemedView>
    );
  }

  const summary = summarize(steps);

  const stepTitle = (s: Step) => {
    switch (s.kind) {
      case 'exercise': {
        const ex = s.exerciseId ? catalog.getExercise(s.exerciseId) : undefined;
        const name = ex ? localize(ex.name, locale) : (s.exerciseId ?? '');
        return s.side ? `${name} (${t(`step.${s.side}`)})` : name;
      }
      case 'rest':
        return t('step.rest');
      case 'note':
        return localize(s.text, locale) || t('step.note');
      case 'unsupported':
        return t('step.unsupported', { type: s.blockType });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: localize(workout.name, locale) }} />
      <FlatList
        data={steps}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {workout.description && <ThemedText>{localize(workout.description, locale)}</ThemedText>}
            <ThemedText type="small" themeColor="textSecondary">
              {formatDuration(summary.totalSeconds, t)} · {t('workouts.exercises', { count: summary.exerciseSteps })}
              {summary.manualSteps > 0 ? ` ${t('workouts.manual', { count: summary.manualSteps })}` : ''}
            </ThemedText>
          </View>
        }
        renderItem={({ item: s, index }) => {
          const prev = steps[index - 1];
          const group = s.groups.at(-1);
          const showGroup = group && prev?.groups.at(-1) !== group;
          const round = s.rounds.at(-1);
          return (
            <View>
              {showGroup && (
                <ThemedText type="smallBold" style={styles.group}>
                  {localize(group, locale)}
                </ThemedText>
              )}
              <ThemedView type={s.kind === 'rest' ? 'background' : 'backgroundElement'} style={styles.step}>
                <View style={styles.stepText}>
                  <ThemedText themeColor={s.kind === 'rest' ? 'textSecondary' : 'text'}>{stepTitle(s)}</ThemedText>
                  {round && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('step.round', round)}
                    </ThemedText>
                  )}
                </View>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {s.duration !== undefined ? formatDuration(s.duration, t) : s.reps ? t('step.reps', { count: s.reps }) : '–'}
                </ThemedText>
              </ThemedView>
            </View>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.three, gap: Spacing.two },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  group: { marginTop: Spacing.three, marginBottom: Spacing.one },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stepText: { flex: 1, gap: 2 },
});
