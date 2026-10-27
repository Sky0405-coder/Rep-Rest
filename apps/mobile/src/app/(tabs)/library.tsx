import { localize } from '@workout/core';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { FigureView } from '@/components/figure-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { listExercises } from '@/data/catalog';
import { exerciseDefaultLabel } from '@/data/labels';
import { useTheme } from '@/hooks/use-theme';
import { tagLabel, useLocale } from '@/i18n';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={listExercises()}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: e }) => (
          <Card onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: e.id } })}>
            <View style={styles.row}>
              <FigureView figure={e.media.figure} size={56} color={theme.tint} mutedColor={theme.backgroundSelected} />
              <View style={styles.text}>
                <ThemedText type="smallBold">{localize(e.name, locale)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {exerciseDefaultLabel(e, t)}
                  {e.sides === 'left_right' ? ` · ${t('step.left')}/${t('step.right')}` : ''}
                  {e.tags.length > 0 ? ` · ${e.tags.map((tag) => tagLabel(tag, t)).join(', ')}` : ''}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: 2 },
});
