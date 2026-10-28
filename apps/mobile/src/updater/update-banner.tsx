import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

import { useUpdater } from './store';

/** Hinweis auf eine neue Version, mit Fortschritt während des Downloads. */
export function UpdateBanner({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const { t } = useTranslation();
  const { status, update, progress, error, dismissed, install, dismiss } = useUpdater();

  if (!update || (!alwaysShow && dismissed === update.version)) return null;
  if (status !== 'available' && status !== 'downloading' && status !== 'error') return null;

  const sizeMb = (update.sizeBytes / 1024 / 1024).toFixed(0);
  const downloading = status === 'downloading';

  return (
    <ThemedView type="backgroundElement" style={styles.box}>
      <ThemedText type="smallBold">{t('updater.available', { version: update.version })}</ThemedText>
      {status === 'error' && (
        <ThemedText type="small" themeColor="danger">
          {t('updater.failed', { error })}
        </ThemedText>
      )}
      {downloading ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button variant="primary" icon="download-outline" label={t('updater.install', { size: sizeMb })} onPress={install} style={styles.flex} />
          {!alwaysShow && <Button label={t('updater.later')} onPress={dismiss} />}
        </View>
      )}
      {downloading && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('updater.downloading', { percent: Math.round(progress * 100) })}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 4, borderLeftColor: Brand.rep },
  actions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(127,127,127,0.25)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Brand.rep },
});
