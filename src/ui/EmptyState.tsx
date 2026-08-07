import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { spacing } from './tokens';

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** The way out. Per the brief, an empty state shows the Add button — not sad clip art. */
  action?: ReactNode;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text variant="h2" center>
        {title}
      </Text>
      {!!body && (
        <Text variant="body" color="textSecondary" center style={styles.body}>
          {body}
        </Text>
      )}
      {!!action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  body: { marginTop: spacing.sm, maxWidth: 320 },
  action: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
