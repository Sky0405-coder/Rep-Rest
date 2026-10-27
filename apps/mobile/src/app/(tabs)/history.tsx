import { localize } from '@workout/core';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { formatDuration, useLocale } from '@/i18n';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const sessions = useAppStore((s) => s.sessions);
  const dateFormat = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Kein Date.now() im Render, damit die Liste stabil bleibt: Bezug ist die letzte Session.
  const reference = sessions[0]?.finishedAt ?? 0;
  const lastWeek = sessions.filter((s) => s.completed && reference - s.finishedAt < WEEK_MS);
  const weekSeconds = lastWeek.reduce((sum, s) => sum + Math.round((s.finishedAt - s.startedAt) / 1000), 0);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          lastWeek.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('history.thisWeek', { count: lastWeek.length, duration: formatDuration(weekSeconds, t) })}
            </ThemedText>
          ) : undefined
        }
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary">
            {t('history.empty')}
          </ThemedText>
        }
        renderItem={({ item: s }) => (
          <Card>
            <View style={styles.row}>
              <ThemedText type="smallBold" style={styles.name}>
                {localize(s.workoutName, locale)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDuration(Math.round((s.finishedAt - s.startedAt) / 1000), t)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {dateFormat.format(s.startedAt)}
              {s.completed ? '' : ` · ${t('history.aborted')} (${s.stepsDone}/${s.stepsTotal})`}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  name: { flex: 1 },
});
