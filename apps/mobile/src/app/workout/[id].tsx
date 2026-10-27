import { exportWorkout, localize, walkBlocks, type Exercise } from '@workout/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { isUserWorkout, useWorkout } from '@/data/catalog';
import { shareJson } from '@/data/files';
import { exportFileName, stepAmount, stepTitle, workoutMeta, workoutSteps } from '@/data/labels';
import { useLocale } from '@/i18n';

function confirm(message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert(message, undefined, [
    { text: action, style: 'destructive', onPress: onConfirm },
    { text: '✕', style: 'cancel' },
  ]);
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const workout = useWorkout(id);
  const deleteWorkout = useAppStore((s) => s.deleteWorkout);
  const steps = useMemo(() => (workout ? workoutSteps(workout) : []), [workout]);

  if (!workout) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{t('workouts.notFound')}</ThemedText>
      </ThemedView>
    );
  }

  const own = isUserWorkout(workout.id);
  const name = localize(workout.name, locale);

  const onExport = () => {
    // Eigene (importierte) Übungen mitliefern, damit der Empfänger sie auch hat.
    const custom = new Map<string, Exercise>();
    walkBlocks(workout.blocks, (b) => {
      const refs = b.type === 'exercise' ? [(b as { ref: string }).ref] : b.type === 'interval' ? (b as { refs: string[] }).refs : [];
      for (const r of refs) {
        const ex = useAppStore.getState().exercises.find((e) => e.id === r);
        if (ex) custom.set(r, ex);
      }
    });
    void shareJson(exportFileName(workout, locale), exportWorkout(workout, [...custom.values()]));
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: name }} />
      <FlatList
        data={steps}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {workout.description && <ThemedText>{localize(workout.description, locale)}</ThemedText>}
            <ThemedText type="small" themeColor="textSecondary">
              {workoutMeta(workout, t)}
            </ThemedText>
            <Button
              variant="primary"
              icon="play"
              label={t('workouts.start')}
              onPress={() => router.push({ pathname: '/player/[id]', params: { id: workout.id } })}
            />
            <View style={styles.actions}>
              {own ? (
                <Button
                  icon="create-outline"
                  label={t('common.edit')}
                  onPress={() => router.push({ pathname: '/workout/edit/[id]', params: { id: workout.id } })}
                  style={styles.action}
                />
              ) : (
                <Button
                  icon="copy-outline"
                  label={t('workouts.copy')}
                  onPress={() => router.push({ pathname: '/workout/edit/[id]', params: { id: 'new', from: workout.id } })}
                  style={styles.action}
                />
              )}
              <Button icon="share-outline" label={t('workouts.export')} onPress={onExport} style={styles.action} />
              {own && (
                <Button
                  variant="danger"
                  icon="trash-outline"
                  accessibilityLabel={t('common.delete')}
                  onPress={() =>
                    confirm(t('workouts.deleteConfirm', { name }), t('common.delete'), () => {
                      void deleteWorkout(workout.id);
                      router.back();
                    })
                  }
                />
              )}
            </View>
          </View>
        }
        renderItem={({ item: s, index }) => {
          const group = s.groups.at(-1);
          const showGroup = group && steps[index - 1]?.groups.at(-1) !== group;
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
                  <ThemedText themeColor={s.kind === 'rest' ? 'textSecondary' : 'text'}>{stepTitle(s, t, locale)}</ThemedText>
                  {round && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('step.round', round)}
                    </ThemedText>
                  )}
                </View>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {stepAmount(s, t)}
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
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
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
