import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Kurze Töne und Vibration für den Player. Die Player werden einmal erzeugt
// und wiederverwendet, damit der Ton ohne Verzögerung kommt.

const SOURCES = {
  tick: require('@/assets/sounds/tick.wav'),
  go: require('@/assets/sounds/go.wav'),
  gong: require('@/assets/sounds/gong.wav'),
  done: require('@/assets/sounds/done.wav'),
} as const;

export type Sound = keyof typeof SOURCES;

let players: Partial<Record<Sound, AudioPlayer>> | undefined;

function getPlayers() {
  if (!players) {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    players = {};
    for (const [name, src] of Object.entries(SOURCES) as [Sound, number][]) players[name] = createAudioPlayer(src);
  }
  return players;
}

/** Lädt die Töne vor, damit der erste Ton nicht verzögert kommt. */
export function preloadSounds() {
  getPlayers();
}

export function playSound(sound: Sound) {
  const p = getPlayers()[sound];
  if (!p) return;
  void p.seekTo(0).then(() => p.play()).catch(() => {});
}

export function releaseSounds() {
  if (!players) return;
  for (const p of Object.values(players)) p?.remove();
  players = undefined;
}

export function vibrate(kind: 'tick' | 'phase') {
  if (Platform.OS === 'web') return;
  if (kind === 'tick') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
