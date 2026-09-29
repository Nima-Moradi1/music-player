import React from 'react';
import {useTranslation} from 'react-i18next';
import {Artwork, Page, Text, Surface} from '../../design-system';
export function DiscoveryScreen() {
  const {t} = useTranslation();
  return (
    <Page>
      <Text kind="heading">{t('discover')}</Text>
      <Artwork seed="discovery" large />
      <Text kind="heading">{t('discoverTitle')}</Text>
      <Surface>
        <Text muted>{t('discoverBody')}</Text>
      </Surface>
    </Page>
  );
}
