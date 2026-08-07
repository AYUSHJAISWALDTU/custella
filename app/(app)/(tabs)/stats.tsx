import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text, spacing } from '@/ui';

export default function StatsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="h1" style={{ marginTop: spacing.sm }}>
        {t('stats.title')}
      </Text>
      {/* Phase 7 replaces this with Total / Today / This Month + top interests and locations. */}
      <EmptyState title={t('stats.empty.title')} body={t('stats.empty.body')} />
    </Screen>
  );
}
