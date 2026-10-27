import { localize, type Workout } from '@workout/core';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { templates } from '@/data/catalog';
import { workoutMeta } from '@/data/labels';
import { useLocale } from '@/i18n';

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const mine = useAppStore((s) => s.workouts);

  const sections = [
    { key: 'mine', title: t('workouts.mine'), data: mine },
    { key: 'templates', title: t('workouts.templates'), data: templates },
  ];

  const open = (w: Workout) => router.push({ pathname: '/workout/[id]', params: { id: w.id } });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('workouts.title') }} />
      <SectionList
        sections={sections}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.actions}>
            <Button
              variant="primary"
              icon="add"
              label={t('workouts.new')}
              onPress={() => router.push({ pathname: '/workout/edit/[id]', params: { id: 'new' } })}
              style={styles.action}
            />
            <Button icon="download-outline" label={t('workouts.import')} onPress={() => router.push('/import')} style={styles.action} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
        )}
        renderSectionFooter={({ section }) =>
          section.key === 'mine' && section.data.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('workouts.empty')}
            </ThemedText>
          ) : null
        }
        renderItem={({ item: w }) => (
          <Card onPress={() => open(w)}>
            <ThemedText type="smallBold">{localize(w.name, locale)}</ThemedText>
            {w.description && (
              <ThemedText type="small" themeColor="textSecondary">
                {localize(w.description, locale)}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {workoutMeta(w, t)}
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
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
  sectionTitle: { marginTop: Spacing.three, marginBottom: Spacing.one, textTransform: 'uppercase', letterSpacing: 0.5 },
});
