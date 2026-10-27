import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Überschreibt Text- und Iconfarbe, z. B. Weiß auf farbigem Hintergrund. */
  color?: string;
  iconSize?: number;
};

export function Button({ label, icon, onPress, variant = 'secondary', disabled, style, accessibilityLabel, color, iconSize = 18 }: Props) {
  const theme = useTheme();
  const bg = { primary: theme.tint, secondary: theme.backgroundElement, danger: theme.backgroundElement, ghost: 'transparent' }[variant];
  const fg = color ?? { primary: theme.onTint, secondary: theme.text, danger: theme.danger, ghost: theme.tint }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        variant === 'secondary' && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.backgroundSelected },
        !label && styles.iconOnly,
        style,
      ]}>
      {icon && <Ionicons name={icon} size={iconSize} color={fg} />}
      {label && <Text style={[styles.label, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  iconOnly: { paddingHorizontal: 10 },
  label: { fontSize: 15, fontWeight: '600' },
});
