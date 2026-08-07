import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen, Text, spacing } from '@/ui';

export default function CustomersScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="h1" style={{ marginTop: spacing.sm }}>
        {t('customers.title')}
      </Text>
      {/* Phase 4 replaces this with the searchable, virtualized list. */}
      <EmptyState
        title={t('customers.empty.title')}
        body={t('customers.empty.body')}
        action={<Button label={t('home.addCustomer')} size="primary" haptic />}
      />
    </Screen>
  );
}
