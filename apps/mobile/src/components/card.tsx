import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function Card({ children, onPress, ...rest }: PressableProps & { children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && onPress && styles.pressed]} {...rest}>
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.7 },
});
