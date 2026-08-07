import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from './tokens';

export type ScreenProps = {
  children: ReactNode;
  /** Horizontal page padding. Off for full-bleed lists. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Page shell: safe-area top, background colour, standard gutters. */
export function Screen({ children, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top },
        padded && { paddingHorizontal: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
