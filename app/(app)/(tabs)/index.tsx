import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { partOfDay } from '@/lib/date';
import { Button, Screen, SyncBadge, Text, spacing } from '@/ui';

/** Phase 2 replaces this with the signed-in profile name. */
const PLACEHOLDER_NAME = 'Ayush';
/** Phase 3 replaces this with a live SQLite count. */
const PLACEHOLDER_TODAY_COUNT = 0;

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h3" color="accent">
          {t('app.name').toUpperCase()}
        </Text>
        <SyncBadge />
      </View>

      <Text variant="h1" style={styles.greeting}>
        {t(`greeting.${partOfDay()}`, { name: PLACEHOLDER_NAME })}
      </Text>

      {/* Spacer: pushes the primary action into the thumb-reachable bottom third. */}
      <View style={styles.spacer} />

      <Button
        label={t('home.addCustomer')}
        size="primary"
        haptic
        accessibilityHint={t('app.tagline')}
      />

      <Button label={t('home.searchCustomer')} variant="secondary" style={styles.search} />

      <View style={styles.today}>
        <Text variant="label" color="textSecondary">
          {t('home.today')}
        </Text>
        <Text variant="h2">
          {t('home.customersAddedToday', { count: PLACEHOLDER_TODAY_COUNT })}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  greeting: { marginTop: spacing.xl },
  spacer: { flex: 1, minHeight: spacing['2xl'] },
  search: { marginTop: spacing.md },
  today: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
});
