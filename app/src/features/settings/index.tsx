import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../app/navigation/types';
import {Button, Page, Row, Surface, Text, Toggle} from '../../design-system';
import {
  refreshLibrary,
  updateSettings,
  useServices,
  useSettings,
} from '../../app/providers/Services';
import {fixtureTrack} from '../../testing/fixtures';
import {benchmarkLibrary} from '../../testing/benchmark';
export function SettingsScreen() {
  const {t} = useTranslation();
  const services = useServices();
  const settings = useSettings();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function measure() {
    setBusy(true);
    setMessage('');
    try {
      setMessage(JSON.stringify(await benchmarkLibrary(services.tracks), null, 2));
    } catch {
      setMessage(t('errorTitle'));
    } finally {
      setBusy(false);
    }
  }
  async function seed() {
    setBusy(true);
    setMessage('');
    try {
      for (let i = 0; i < 10000; i++) {
        const track = fixtureTrack(i);
        if (!(await services.tracks.get(track.id))) {
          await services.tracks.save(track, {type: 'fixture', originalFilename: `fixture-${i}`});
        }
        if (i % 100 === 0) {
          setMessage(String(i));
          await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
      }
      refreshLibrary(services);
      setMessage(t('done'));
    } catch {
      setMessage(t('errorTitle'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Text kind="title">{t('appearance')}</Text>
      <Row>
        {(['system', 'light', 'dark'] as const).map(theme => (
          <Button
            key={theme}
            label={t(theme)}
            secondary={settings.theme !== theme}
            selected={settings.theme === theme}
            onPress={() => {
              void updateSettings(services, {theme});
            }}
          />
        ))}
      </Row>
      <Text kind="title">{t('language')}</Text>
      <Row>
        <Button
          label="English"
          secondary={settings.locale !== 'en'}
          selected={settings.locale === 'en'}
          onPress={() => {
            void updateSettings(services, {locale: 'en'});
          }}
        />
        <Button
          label="فارسی"
          secondary={settings.locale !== 'fa'}
          selected={settings.locale === 'fa'}
          onPress={() => {
            void updateSettings(services, {locale: 'fa'});
          }}
        />
      </Row>
      <Text kind="title">{t('accessibility')}</Text>
      {(['reduceMotion', 'reduceTransparency', 'highContrast'] as const).map(key => (
        <Toggle
          key={key}
          label={t(key)}
          value={settings[key]}
          onValueChange={value => {
            void updateSettings(services, {[key]: value});
          }}
        />
      ))}
      <Surface>
        <Text kind="title">{t('privacy')}</Text>
        <Text muted>{t('privacyBody')}</Text>
      </Surface>
      <Surface>
        <Text kind="title">{t('telegram')}</Text>
        <Text muted>{t('telegramPolicyIntro')}</Text>
        <Button
          label={t('telegramPolicyOpen')}
          secondary
          onPress={() => navigation.navigate('TelegramSettings')}
        />
      </Surface>
      {__DEV__ && (
        <Surface>
          <Text kind="title">{t('diagnostics')}</Text>
          <Text muted>{t('fixtureBody')}</Text>
          <Button
            label={t('fixture')}
            onPress={() => {
              void seed();
            }}
            disabled={busy}
          />
          <Button
            label={t('benchmark')}
            secondary
            disabled={busy}
            onPress={() => {
              void measure();
            }}
          />
          <Text accessibilityLiveRegion="polite">{message}</Text>
          <Text kind="caption">RN 0.87.1 · SQLite schema 1 · ManagedMedia v1</Text>
        </Surface>
      )}
    </Page>
  );
}
