import React from 'react';
import {useTranslation} from 'react-i18next';
import {EmptyState, Page, Text} from '../../design-system';
export function DownloadsScreen() {
  const {t} = useTranslation();
  return (
    <Page>
      <Text kind="heading">{t('downloads')}</Text>
      <EmptyState icon="downloads" title={t('downloadsTitle')} body={t('downloadsBody')} />
    </Page>
  );
}
