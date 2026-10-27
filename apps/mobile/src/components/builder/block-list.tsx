import { hasChildren, localize, type Block, type BlockPath, type ExerciseBlock, type GroupBlock, type RepeatBlock } from '@workout/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { FigureView } from '@/components/figure-view';
import { secondsStep, Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/catalog';
import { exerciseName } from '@/data/labels';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, useLocale } from '@/i18n';

export type BlockActions = {
  replace: (path: BlockPath, block: Block) => void;
  remove: (path: BlockPath) => void;
  move: (path: BlockPath, delta: number) => void;
  /** Öffnet die Auswahl zum Hinzufügen in die Liste unter `parentPath`. */
  add: (parentPath: BlockPath, kind: 'exercise' | 'rest' | 'repeat' | 'group') => void;
};

type ListProps = { blocks: Block[]; path: BlockPath; actions: BlockActions; depth?: number };

/** Rekursive Liste der Bausteine einer Ebene mit Hinzufügen-Leiste darunter. */
export function BlockList({ blocks, path, actions, depth = 0 }: ListProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.list, depth > 0 && styles.nested]}>
      {blocks.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('builder.emptyLevel')}
        </ThemedText>
      )}
      {blocks.map((b, i) => (
        <BlockRow key={i} block={b} path={[...path, i]} actions={actions} depth={depth} first={i === 0} last={i === blocks.length - 1} />
      ))}
      <View style={styles.addBar}>
        <Button icon="barbell-outline" label={t('builder.addExercise')} onPress={() => actions.add(path, 'exercise')} />
        <Button icon="pause-outline" label={t('builder.addRest')} onPress={() => actions.add(path, 'rest')} />
        <Button icon="repeat-outline" label={t('builder.addRepeat')} onPress={() => actions.add(path, 'repeat')} />
        {depth === 0 && <Button icon="albums-outline" label={t('builder.addGroup')} onPress={() => actions.add(path, 'group')} />}
      </View>
    </View>
  );
}

type RowProps = { block: Block; path: BlockPath; actions: BlockActions; depth: number; first: boolean; last: boolean };

function BlockRow({ block, path, actions, depth, first, last }: RowProps) {
  const { t } = useTranslation();
  const cardType = depth % 2 === 0 ? 'backgroundElement' : 'background';
  const controls = (
    <View style={styles.controls}>
      <Button variant="ghost" icon="chevron-up" onPress={() => actions.move(path, -1)} disabled={first} accessibilityLabel="↑" />
      <Button variant="ghost" icon="chevron-down" onPress={() => actions.move(path, 1)} disabled={last} accessibilityLabel="↓" />
      <Button variant="ghost" icon="trash-outline" onPress={() => actions.remove(path)} accessibilityLabel={t('common.delete')} />
    </View>
  );

  switch (block.type) {
    case 'exercise':
      return <ExerciseRow block={block as ExerciseBlock} path={path} actions={actions} controls={controls} cardType={cardType} />;
    case 'rest':
      return (
        <ThemedView style={[styles.card, styles.restCard]}>
          <View style={styles.headerRow}>
            <ThemedText type="smallBold" style={styles.flex}>
              {t('builder.rest')}
            </ThemedText>
            {controls}
          </View>
          <Stepper
            value={(block as { duration: number }).duration}
            step={secondsStep}
            format={(v) => formatDuration(v, t)}
            onChange={(v) => actions.replace(path, { ...block, duration: v })}
          />
        </ThemedView>
      );
    case 'repeat': {
      const b = block as RepeatBlock;
      return (
        <ThemedView type={cardType} style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText type="smallBold" style={styles.flex}>
              {t('builder.rounds', { count: b.times })}
            </ThemedText>
            {controls}
          </View>
          <Stepper value={b.times} max={100} format={(v) => `${v}×`} onChange={(v) => actions.replace(path, { ...b, times: v })} />
          <ThemedText type="small" themeColor="textSecondary">
            {t('builder.restBetween')}
          </ThemedText>
          <Stepper
            value={b.restBetween ?? 0}
            min={0}
            step={secondsStep}
            format={(v) => formatDuration(v, t)}
            onChange={(v) => actions.replace(path, { ...b, restBetween: v === 0 ? undefined : v })}
          />
          <BlockList blocks={b.blocks} path={path} actions={actions} depth={depth + 1} />
        </ThemedView>
      );
    }
    case 'group':
      return <GroupRow block={block as GroupBlock} path={path} actions={actions} controls={controls} depth={depth} />;
    default:
      // Notizen, Intervalle und Pack-Bausteine werden übernommen, aber hier (noch) nicht bearbeitet.
      return (
        <ThemedView type={cardType} style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText type="smallBold" style={styles.flex}>
              {block.type}
            </ThemedText>
            {controls}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {t('builder.readonly')}
          </ThemedText>
          {hasChildren(block) && <BlockList blocks={block.blocks} path={path} actions={actions} depth={depth + 1} />}
        </ThemedView>
      );
  }
}

type ExerciseRowProps = {
  block: ExerciseBlock;
  path: BlockPath;
  actions: BlockActions;
  controls: React.ReactNode;
  cardType: 'background' | 'backgroundElement';
};

function ExerciseRow({ block, path, actions, controls, cardType }: ExerciseRowProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  const exercise = getExercise(block.ref);
  const byReps = block.reps !== undefined;

  const setMode = (reps: boolean) => {
    if (reps === byReps) return;
    const d = exercise?.defaults;
    actions.replace(
      path,
      reps ? { type: 'exercise', ref: block.ref, reps: d?.reps ?? 10 } : { type: 'exercise', ref: block.ref, duration: d?.duration ?? 30 },
    );
  };

  return (
    <ThemedView type={cardType} style={styles.card}>
      <View style={styles.headerRow}>
        <FigureView figure={exercise?.media.figure} size={40} color={Brand.rep} mutedColor={theme.backgroundSelected} />
        <ThemedText type="smallBold" style={styles.flex}>
          {exerciseName(block.ref, locale)}
        </ThemedText>
        {controls}
      </View>
      <View style={styles.valueRow}>
        <View style={styles.toggle}>
          <Button variant={byReps ? 'secondary' : 'primary'} label={t('builder.time')} onPress={() => setMode(false)} />
          <Button variant={byReps ? 'primary' : 'secondary'} label={t('builder.reps')} onPress={() => setMode(true)} />
        </View>
        {byReps ? (
          <Stepper value={block.reps!} max={500} format={(v) => t('step.reps', { count: v })} onChange={(v) => actions.replace(path, { ...block, reps: v })} />
        ) : (
          <Stepper
            value={block.duration ?? exercise?.defaults.duration ?? 30}
            step={secondsStep}
            format={(v) => formatDuration(v, t)}
            onChange={(v) => actions.replace(path, { ...block, duration: v, reps: undefined })}
          />
        )}
      </View>
    </ThemedView>
  );
}

function GroupRow({ block, path, actions, controls, depth }: { block: GroupBlock; path: BlockPath; actions: BlockActions; controls: React.ReactNode; depth: number }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <View style={styles.headerRow}>
        <TextInput
          value={localize(block.name, locale)}
          onChangeText={(text) => actions.replace(path, { ...block, name: { ...block.name, [locale]: text } })}
          placeholder={t('builder.groupName')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.groupInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
        {controls}
      </View>
      <BlockList blocks={block.blocks} path={path} actions={actions} depth={depth + 1} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  nested: { borderLeftWidth: 2, borderLeftColor: Brand.rest, paddingLeft: Spacing.two, marginTop: Spacing.one },
  addBar: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  card: { borderRadius: 14, padding: Spacing.two, gap: Spacing.two },
  restCard: { borderWidth: 1, borderColor: Brand.rest },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.two },
  toggle: { flexDirection: 'row', gap: Spacing.one },
  controls: { flexDirection: 'row' },
  flex: { flex: 1 },
  group: { gap: Spacing.one, marginTop: Spacing.two },
  groupInput: { flex: 1, fontSize: 17, fontWeight: '600', borderBottomWidth: 1, paddingVertical: 4 },
});
