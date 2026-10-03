import React from 'react';
import {useTranslation} from 'react-i18next';
import {Page, Surface, Text, Toggle} from '../../design-system';
import {updateTelegramPolicy, useServices, useTelegramPolicy} from '../../app/providers/Services';
import type {TelegramPolicy} from '../../domain/telegram/policy';

const sourceKeys = ['savedMessages', 'privateChats', 'channels', 'groups'] as const;
const transferKeys = ['autoImport', 'wifiOnly', 'paused'] as const;

export function TelegramSettingsScreen() {
  const {t} = useTranslation();
  const services = useServices();
  const policy = useTelegramPolicy();
  function set(key: keyof TelegramPolicy, value: boolean) {
    updateTelegramPolicy(services, {[key]: value});
  }
  return (
    <Page>
      <Text kind="heading">{t('telegramPolicyTitle')}</Text>
      <Surface>
        <Text>{t('telegramDisclosure')}</Text>
        <Text muted>{t('telegramConnectUnavailable')}</Text>
      </Surface>
      <Text kind="title">{t('telegramSources')}</Text>
      <Surface>
        {sourceKeys.map(key => (
          <Toggle
            key={key}
            label={t(key)}
            value={policy[key]}
            onValueChange={value => set(key, value)}
          />
        ))}
      </Surface>
      <Text kind="title">{t('telegramTransfer')}</Text>
      <Surface>
        {transferKeys.map(key => (
          <Toggle
            key={key}
            label={t(key)}
            value={policy[key]}
            onValueChange={value => set(key, value)}
          />
        ))}
        <Text muted>{t('telegramMaxFile')}</Text>
        <Text muted>{t('telegramStorageCap')}</Text>
      </Surface>
      <Surface>
        <Text kind="title">{t('telegramConsentTitle')}</Text>
        <Text muted>{t('telegramConsentBody')}</Text>
        <Toggle
          label={t('telegramConsent')}
          value={policy.consent}
          onValueChange={value => set('consent', value)}
        />
      </Surface>
    </Page>
  );
}
