import { CORE_BLOCK_TYPES, importWorkout, localize, type ImportIssue } from '@workout/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { hasExercise, newWorkoutId } from '@/data/catalog';
import { pickJsonText } from '@/data/files';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/i18n';

const supportedBlockTypes = new Set<string>(CORE_BLOCK_TYPES);

export default function ImportScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const run = async (json: string) => {
    const result = importWorkout(json, { hasExercise, supportedBlockTypes });
    if (!result.ok) {
      setIssues(result.issues);
      setWarnings([]);
      return;
    }
    const { file } = result;
    const store = useAppStore.getState();
    if (file.customExercises.length > 0) await store.saveExercises(file.customExercises);
    // Importe bekommen immer eine eigene ID, damit sie nichts Vorhandenes überschreiben.
    const workout = { ...file.workout, id: newWorkoutId() };
    await store.saveWorkout(workout);

    const notes = [t('import.success', { name: localize(workout.name, locale) })];
    if (result.missingExercises.length) notes.push(t('import.missing', { list: result.missingExercises.join(', ') }));
    if (result.unsupportedBlocks.length) notes.push(t('import.unsupported', { list: result.unsupportedBlocks.join(', ') }));
    if (notes.length === 1) {
      router.replace({ pathname: '/workout/[id]', params: { id: workout.id } });
    } else {
      setIssues([]);
      setWarnings(notes);
    }
  };

  const pick = async () => {
    const content = await pickJsonText();
    if (content !== null) await run(content);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button variant="primary" icon="document-outline" label={t('import.pickFile')} onPress={pick} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('import.orPaste')}
        </ThemedText>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder={t('import.pastePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, fontFamily: Fonts.mono }]}
        />
        <Button label={t('import.check')} onPress={() => run(text)} disabled={text.trim().length === 0} />

        {issues.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.box}>
            <ThemedText type="smallBold" themeColor="danger">
              {t('import.errors')}
            </ThemedText>
            {issues.slice(0, 20).map((i, n) => (
              <ThemedText key={n} type="small">
                {i.path ? `${i.path}: ` : ''}
                {i.message}
              </ThemedText>
            ))}
          </ThemedView>
        )}
        {warnings.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.box}>
            {warnings.map((w, n) => (
              <ThemedText key={n} type={n === 0 ? 'smallBold' : 'small'}>
                {w}
              </ThemedText>
            ))}
            <Button label={t('common.done')} onPress={() => router.back()} />
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  input: { minHeight: 160, borderRadius: 12, padding: Spacing.three, fontSize: 12, textAlignVertical: 'top' },
  box: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
});
