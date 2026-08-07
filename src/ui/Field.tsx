import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { colors, radius, spacing, touch, type as typeScale } from './tokens';

export type FieldProps = TextInputProps & {
  label: string;
  /** Validation message. Presence switches the field to its error state. */
  error?: string;
  /** Quiet helper line under the field — used for the "New customer" duplicate hint. */
  hint?: string;
  hintTone?: 'muted' | 'success' | 'warning';
};

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, hintTone = 'muted', style, ...rest },
  ref
) {
  return (
    <View style={styles.wrap}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...rest}
      />
      {!!error && (
        <Text variant="caption" color="danger" style={styles.sub}>
          {error}
        </Text>
      )}
      {!error && !!hint && (
        <Text variant="caption" color={HINT_COLOR[hintTone]} style={styles.sub}>
          {hint}
        </Text>
      )}
    </View>
  );
});

const HINT_COLOR = {
  muted: 'textMuted',
  success: 'success',
  warning: 'warning',
} as const;

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginBottom: spacing.xs },
  input: {
    minHeight: touch.comfortable,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: typeScale.body.fontSize,
  },
  inputError: { borderColor: colors.danger },
  sub: { marginTop: spacing.xs },
});
