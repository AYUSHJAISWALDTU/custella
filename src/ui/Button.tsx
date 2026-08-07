import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from './Text';
import { colors, radius, spacing, touch } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'primary' | 'default' | 'compact';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /**
   * Fires a success haptic before onPress. On for saves — the brief requires instant
   * haptic + visual feedback on every save, and it must not wait on the network.
   */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const HEIGHTS: Record<Size, number> = {
  primary: touch.primary,
  default: touch.comfortable,
  compact: touch.min,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  haptic = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      // Fire-and-forget: feedback must never delay the write.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size] },
        variantStyle(variant, pressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.accent} />
      ) : (
        <Text
          variant={size === 'primary' ? 'button' : 'bodyStrong'}
          color={labelColor(variant)}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function variantStyle(variant: Variant, pressed: boolean): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? colors.accentPressed : colors.accent };
    case 'secondary':
      return {
        backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'danger':
      return { backgroundColor: pressed ? colors.dangerSubtle : colors.bg, borderWidth: 1, borderColor: colors.danger };
    case 'ghost':
      return { backgroundColor: pressed ? colors.surface : 'transparent' };
  }
}

function labelColor(variant: Variant) {
  if (variant === 'primary') return 'textInverse' as const;
  if (variant === 'danger') return 'danger' as const;
  return 'text' as const;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: { opacity: 0.4 },
});
