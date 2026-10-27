import { localize, type Exercise } from '@workout/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FigureView } from '@/components/figure-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { listExercises } from '@/data/catalog';
import { exerciseDefaultLabel } from '@/data/labels';
import { useTheme } from '@/hooks/use-theme';
import { tagLabel, useLocale } from '@/i18n';

type Props = { visible: boolean; onPick: (e: Exercise) => void; onClose: () => void };

export function ExercisePicker({ visible, onPick, onClose }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listExercises().filter(
      (e) => !q || localize(e.name, locale).toLowerCase().includes(q) || e.tags.some((tag) => tagLabel(tag, t).toLowerCase().includes(q)),
    );
  }, [query, locale, t]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <ThemedText type="smallBold" style={styles.title}>
              {t('builder.pickExercise')}
            </ThemedText>
            <Button variant="ghost" label={t('common.cancel')} onPress={onClose} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('builder.search')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <FlatList
            data={items}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: e }) => (
              <Pressable onPress={() => onPick(e)} style={({ pressed }) => [styles.row, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}>
                <FigureView figure={e.media.figure} size={44} color={theme.tint} mutedColor={theme.backgroundSelected} />
                <View style={styles.text}>
                  <ThemedText type="smallBold">{localize(e.name, locale)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {exerciseDefaultLabel(e, t)} · {e.tags.map((tag) => tagLabel(tag, t)).join(', ')}
                  </ThemedText>
                </View>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  title: { flex: 1, fontSize: 18 },
  search: { margin: Spacing.three, borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: 14, padding: Spacing.two },
  text: { flex: 1, gap: 2 },
});
