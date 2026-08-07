import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { colors, radius, spacing, touch } from './tokens';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Static display (e.g. on a customer row), not a control. */
  readOnly?: boolean;
};

/** Multi-select pill used for interests. Selected state is fill, not a border — readable in sun. */
export function Chip({ label, selected = false, onPress, readOnly = false }: ChipProps) {
  if (readOnly) {
    return (
      <Text style={[styles.chip, styles.readOnly]} variant="caption" color="textSecondary">
        {label}
      </Text>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        styles.interactive,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text variant="label" color={selected ? 'textInverse' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
  interactive: {
    minHeight: touch.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: { backgroundColor: colors.accent },
  unselected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  readOnly: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
  },
});
