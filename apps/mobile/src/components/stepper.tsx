import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** Schrittweite abhängig vom aktuellen Wert, z. B. 5 s unter einer Minute, sonst 15 s. */
  step?: number | ((value: number, direction: 1 | -1) => number);
  format?: (v: number) => string;
};

export function Stepper({ value, onChange, min = 1, max = 3600, step = 1, format = String }: Props) {
  const delta = (dir: 1 | -1) => (typeof step === 'function' ? step(value, dir) : step);
  const change = (dir: 1 | -1) => onChange(Math.min(max, Math.max(min, value + dir * delta(dir))));
  return (
    <View style={styles.row}>
      <Button icon="remove" onPress={() => change(-1)} disabled={value <= min} accessibilityLabel="−" />
      <ThemedText type="smallBold" style={styles.value}>
        {format(value)}
      </ThemedText>
      <Button icon="add" onPress={() => change(1)} disabled={value >= max} accessibilityLabel="+" />
    </View>
  );
}

/** 5 s bis eine Minute, darüber 15 s. */
export const secondsStep = (value: number, dir: 1 | -1) => (value + (dir === 1 ? 0 : -1) < 60 ? 5 : 15);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  value: { minWidth: 64, textAlign: 'center' },
});
