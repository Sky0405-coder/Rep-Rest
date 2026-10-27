import { localize, type PlayerConfig, type PlayerEvent } from '@workout/core';
import * as Crypto from 'expo-crypto';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FigureView } from '@/components/figure-view';
import { Brand, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { getExercise, useWorkout } from '@/data/catalog';
import { stepAmount, stepTitle, workoutSteps } from '@/data/labels';
import { formatClock, formatDuration, useLocale } from '@/i18n';
import { playSound, preloadSounds, vibrate } from '@/player/feedback';
import { usePlayer } from '@/player/use-player';

export default function PlayerScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const { width, height } = useWindowDimensions();
  const workout = useWorkout(id);
  const settings = useAppStore((s) => s.settings);
  const addSession = useAppStore((s) => s.addSession);

  const steps = useMemo(() => (workout ? workoutSteps(workout) : []), [workout]);
  const config = useMemo<PlayerConfig>(() => ({ leadInSeconds: settings.leadInSeconds, cueSeconds: 3 }), [settings.leadInSeconds]);
  const saved = useRef(false);

  const onEvents = (events: PlayerEvent[]) => {
    const types = new Set(events.map((e) => e.type));
    // Pro Takt nur ein Ton, der wichtigste gewinnt.
    let sound: Parameters<typeof playSound>[0] | undefined;
    if (types.has('done')) sound = 'done';
    else if (types.has('stepEnd')) sound = 'gong';
    else if (types.has('stepStart')) sound = 'go';
    else if (types.has('cue')) sound = 'tick';
    if (sound && settings.sound) playSound(sound);
    if (sound && settings.vibration) vibrate(sound === 'tick' ? 'tick' : 'phase');
    if (types.has('done')) save(true);
  };

  const { state, view, dispatch } = usePlayer(steps, config, onEvents);

  function save(completed: boolean) {
    if (saved.current || !workout || state.startedAt === null) return;
    saved.current = true;
    void addSession({
      id: Crypto.randomUUID(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: state.startedAt,
      finishedAt: Date.now(),
      completed,
      stepsDone: completed ? steps.length : state.stepIndex,
      stepsTotal: steps.length,
    });
  }

  useEffect(() => {
    preloadSounds();
    dispatch({ type: 'start' });
  }, [dispatch]);

  if (!workout || steps.length === 0) return null;

  const { step, nextStep, remainingMs } = view;
  const leadIn = state.status === 'countdown' || (state.status === 'paused' && state.pausedFrom === 'countdown');
  const done = state.status === 'done';
  const paused = state.status === 'paused';
  const background = done || leadIn || step?.kind === 'note' ? Brand.night : step?.kind === 'rest' ? Brand.rest : Brand.rep;
  const figureSize = Math.min(width * 0.7, height * 0.32);
  const exercise = step?.exerciseId ? getExercise(step.exerciseId) : undefined;
  const round = step?.rounds.at(-1);

  const close = () => {
    if (done || state.stepIndex === 0) {
      if (!done && state.status !== 'ready') save(false);
      router.back();
      return;
    }
    // Während der Rückfrage anhalten, sonst läuft die Übung im Hintergrund weiter.
    const wasRunning = state.status === 'running' || state.status === 'countdown';
    if (wasRunning) dispatch({ type: 'pause' });
    const quit = () => {
      save(false);
      router.back();
    };
    const resume = () => wasRunning && dispatch({ type: 'resume' });
    if (Platform.OS === 'web') {
      if (window.confirm(t('player.quitTitle'))) quit();
      else resume();
      return;
    }
    Alert.alert(
      t('player.quitTitle'),
      undefined,
      [
        { text: t('player.continue'), style: 'cancel', onPress: resume },
        { text: t('player.quit'), style: 'destructive', onPress: quit },
      ],
      { cancelable: true, onDismiss: resume },
    );
  };

  if (done) {
    const seconds = Math.round(((state.finishedAt ?? Date.now()) - (state.startedAt ?? Date.now())) / 1000);
    return (
      <View style={[styles.screen, { backgroundColor: background }]}>
        <SafeAreaView style={styles.doneContent}>
          <Text style={styles.doneTitle}>{t('player.finished')}</Text>
          <Text style={styles.doneSub}>{localize(workout.name, locale)}</Text>
          <Text style={styles.doneSub}>{t('player.finishedSub', { duration: formatDuration(seconds, t), count: steps.length })}</Text>
          <Button variant="primary" label={t('common.done')} onPress={() => router.back()} style={styles.doneButton} />
        </SafeAreaView>
      </View>
    );
  }

  const title = leadIn ? t('player.getReady') : step ? stepTitle(step, t, locale) : '';
  const upcoming = leadIn ? step : nextStep;

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Button variant="ghost" icon="close" color={Brand.onBrand} onPress={close} accessibilityLabel={t('common.close')} style={styles.onBrandButton} />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${view.overallProgress * 100}%` }]} />
          </View>
          <Text style={styles.counter}>
            {Math.min(state.stepIndex + 1, steps.length)}/{steps.length}
          </Text>
        </View>

        <Pressable style={styles.center} onPress={() => dispatch({ type: paused ? 'resume' : 'pause' })}>
          {round && !leadIn && <Text style={styles.round}>{t('step.round', round)}</Text>}
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
            {title}
          </Text>
          {exercise?.media.figure && !leadIn && (
            <FigureView figure={exercise.media.figure} size={figureSize} color={Brand.onBrand} mutedColor="rgba(255,255,255,0.35)" animate={!paused} />
          )}
          {remainingMs !== null ? (
            <Text style={styles.clock} adjustsFontSizeToFit numberOfLines={1}>
              {formatClock(remainingMs / 1000)}
            </Text>
          ) : (
            step && <Text style={styles.clock}>{stepAmount(step, t)}</Text>
          )}
          {paused && <Text style={styles.paused}>{t('player.paused')}</Text>}
          {exercise && !leadIn && exercise.cues[0] && <Text style={styles.cue}>{localize(exercise.cues[0], locale)}</Text>}
        </Pressable>

        <View style={styles.bottom}>
          {upcoming && (
            <Text style={styles.next} numberOfLines={1}>
              {leadIn ? '' : `${t('player.next')}: `}
              {stepTitle(upcoming, t, locale)} · {stepAmount(upcoming, t)}
            </Text>
          )}
          {!upcoming && !leadIn && <Text style={styles.next}>{t('player.last')}</Text>}

          {remainingMs === null && !leadIn && (
            <Button variant="primary" icon="checkmark" iconSize={24} color={Brand.onBrand} label={t('player.doneReps')} onPress={() => dispatch({ type: 'next' })} style={styles.bigButton} />
          )}

          <View style={styles.controls}>
            <ControlButton icon="play-skip-back" onPress={() => dispatch({ type: 'prev' })} label="prev" />
            <ControlButton icon={paused ? 'play' : 'pause'} big onPress={() => dispatch({ type: paused ? 'resume' : 'pause' })} label={paused ? 'play' : 'pause'} />
            <ControlButton icon="play-skip-forward" onPress={() => dispatch({ type: 'next' })} label="next" />
            {remainingMs !== null && (
              <Pressable onPress={() => dispatch({ type: 'addTime', seconds: 10 })} style={styles.plus}>
                <Text style={styles.plusText}>{t('player.plus10')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ControlButton({ icon, onPress, big, label }: { icon: 'play' | 'pause' | 'play-skip-back' | 'play-skip-forward'; onPress: () => void; big?: boolean; label: string }) {
  return (
    <Button
      variant="ghost"
      icon={icon}
      iconSize={big ? 36 : 26}
      color={Brand.onBrand}
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.control, big && styles.controlBig]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two },
  onBrandButton: { backgroundColor: 'rgba(255,255,255,0.18)' },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Brand.onBrand },
  counter: { color: Brand.onBrand, fontWeight: '700', fontVariant: ['tabular-nums'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  round: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  title: { color: Brand.onBrand, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  clock: { color: Brand.onBrand, fontSize: 96, fontWeight: '800', fontVariant: ['tabular-nums'] },
  paused: { color: Brand.onBrand, fontSize: 18, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  cue: { color: 'rgba(255,255,255,0.9)', fontSize: 16, textAlign: 'center' },
  bottom: { gap: Spacing.three, paddingBottom: Spacing.three },
  next: { color: 'rgba(255,255,255,0.9)', fontSize: 16, textAlign: 'center' },
  bigButton: { paddingVertical: Spacing.three, backgroundColor: 'rgba(0,0,0,0.25)' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  control: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 32, width: 56, height: 56 },
  controlBig: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.28)' },
  plus: { position: 'absolute', right: 0, padding: Spacing.two },
  plusText: { color: Brand.onBrand, fontWeight: '700' },
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  doneTitle: { color: Brand.onBrand, fontSize: 40, fontWeight: '800' },
  doneSub: { color: 'rgba(255,255,255,0.85)', fontSize: 18, textAlign: 'center' },
  doneButton: { marginTop: Spacing.four, alignSelf: 'stretch' },
});
