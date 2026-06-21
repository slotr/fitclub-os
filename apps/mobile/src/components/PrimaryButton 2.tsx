import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost';

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  full = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].btn,
        full && { width: '100%' },
        disabled && { opacity: 0.5 },
        pressed && !disabled && { transform: [{ translateY: -1 }] },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
});

const variantStyles: Record<Variant, { btn: ViewStyle; label: { color: string } }> = {
  primary: {
    btn: { backgroundColor: tokens.color.fg },
    label: { color: tokens.color.surface },
  },
  secondary: {
    btn: {
      backgroundColor: tokens.color.surface,
      borderWidth: 1,
      borderColor: tokens.color.border,
    },
    label: { color: tokens.color.fg },
  },
  accent: {
    btn: { backgroundColor: tokens.color.accent },
    label: { color: tokens.color.accentFg },
  },
  ghost: {
    btn: { backgroundColor: 'transparent' },
    label: { color: tokens.color.fgMuted },
  },
};
