import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useSyncStatus } from '@/stores/syncStatus';

import { Text } from './Text';
import { colors, radius, spacing } from './tokens';

/**
 * 🟠 Offline · 🔄 Syncing · 🟢 N synced.
 * Sync state must always be visible, so this never renders null.
 */
export function SyncBadge() {
  const { t } = useTranslation();
  const status = useSyncStatus((s) => s.status);

  const { dot, label, bg, fg } = (() => {
    switch (status.kind) {
      case 'offline':
        return {
          dot: '🟠',
          label: t('sync.offline'),
          bg: colors.warningSubtle,
          fg: 'warning' as const,
        };
      case 'syncing':
        return {
          dot: '🔄',
          label: t('sync.syncing'),
          bg: colors.surface,
          fg: 'textSecondary' as const,
        };
      case 'synced':
        return {
          dot: '🟢',
          label:
            status.justSynced > 0
              ? t('sync.synced', { count: status.justSynced })
              : t('sync.allSynced'),
          bg: colors.successSubtle,
          fg: 'success' as const,
        };
    }
  })();

  return (
    <View style={[styles.root, { backgroundColor: bg }]} accessibilityRole="text">
      <Text variant="caption">{dot}</Text>
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
