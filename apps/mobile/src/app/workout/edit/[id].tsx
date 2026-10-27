import {
  insertBlock,
  localize,
  moveBlock,
  removeBlock,
  replaceBlock,
  summarize,
  Workout,
  type Block,
  type BlockPath,
  type Exercise,
} from '@workout/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { BlockList, type BlockActions } from '@/components/builder/block-list';
import { ExercisePicker } from '@/components/builder/exercise-picker';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { isUserWorkout, newWorkoutId, useWorkout } from '@/data/catalog';
import { workoutSteps } from '@/data/labels';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, useLocale } from '@/i18n';

export default function EditWorkoutScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  const existing = useWorkout(id);
  const source = useWorkout(from ?? '');
  const saveWorkout = useAppStore((s) => s.saveWorkout);

  // Neues Workout, Kopie einer Vorlage oder Bearbeiten eines eigenen Workouts.
  const [draft, setDraft] = useState<Workout>(() => {
    if (existing && isUserWorkout(existing.id)) return existing;
    if (source) {
      return { ...source, id: newWorkoutId(), name: { [locale]: t('workouts.copyName', { name: localize(source.name, locale) }) } };
    }
    return { id: newWorkoutId(), name: { [locale]: '' }, sportPack: 'general', tags: [], blocks: [] } as unknown as Workout;
  });
  const [pickerFor, setPickerFor] = useState<BlockPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setBlocks = (fn: (blocks: Block[]) => Block[]) => setDraft((d) => ({ ...d, blocks: fn(d.blocks) }));

  const actions: BlockActions = {
    replace: (path, block) => setBlocks((b) => replaceBlock(b, path, block)),
    remove: (path) => setBlocks((b) => removeBlock(b, path)),
    move: (path, delta) => setBlocks((b) => moveBlock(b, path, delta)),
    add: (parent, kind) => {
      if (kind === 'exercise') return setPickerFor(parent);
      const block: Block =
        kind === 'rest'
          ? { type: 'rest', duration: 30 }
          : kind === 'repeat'
            ? { type: 'repeat', times: 3, restBetween: 60, blocks: [] }
            : { type: 'group', name: { [locale]: t('builder.groupName') }, blocks: [] };
      setBlocks((b) => insertBlock(b, parent, block));
    },
  };

  const pick = (e: Exercise) => {
    if (!pickerFor) return;
    const block: Block =
      e.defaults.mode === 'reps' && e.defaults.reps
        ? { type: 'exercise', ref: e.id, reps: e.defaults.reps }
        : { type: 'exercise', ref: e.id, duration: e.defaults.duration ?? 30 };
    setBlocks((b) => insertBlock(b, pickerFor, block));
    setPickerFor(null);
  };

  const save = async () => {
    const result = Workout.safeParse(draft);
    if (!result.success) {
      setError(t('builder.invalid'));
      return;
    }
    await saveWorkout(result.data);
    router.dismissTo({ pathname: '/workout/[id]', params: { id: result.data.id } });
  };

  const valid = Workout.safeParse(draft).success;
  const summary = valid ? summarize(workoutSteps(draft)) : undefined;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: isUserWorkout(id) ? t('builder.titleEdit') : t('builder.titleNew'),
          headerRight: () => <Button variant="ghost" label={t('common.save')} onPress={save} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={localize(draft.name, locale)}
          onChangeText={(text) => setDraft((d) => ({ ...d, name: { ...d.name, [locale]: text } }))}
          placeholder={t('builder.namePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.name, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
        {summary && (
          <ThemedText type="small" themeColor="textSecondary">
            {formatDuration(summary.estimatedSeconds, t)} · {t('workouts.exercises', { count: summary.exerciseSteps })}
          </ThemedText>
        )}
        <BlockList blocks={draft.blocks} path={[]} actions={actions} />
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
        <Button variant="primary" icon="checkmark" label={t('common.save')} onPress={save} />
      </ScrollView>
      <ExercisePicker visible={pickerFor !== null} onPick={pick} onClose={() => setPickerFor(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  name: { fontSize: 22, fontWeight: '700', borderBottomWidth: 1, paddingVertical: Spacing.one },
});
