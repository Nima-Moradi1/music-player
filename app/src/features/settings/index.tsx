import React, {useState} from 'react';
import {Switch, View, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Button, Page, Row, Surface, Text, tokens} from '../../design-system';
import {
  refreshLibrary,
  updateSettings,
  useServices,
  useSettings,
} from '../../app/providers/Services';
import {fixtureTrack} from '../../testing/fixtures';
export function SettingsScreen() {
  const {t} = useTranslation();
  const services = useServices();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
          onPress={() => {
            void updateSettings(services, {locale: 'en'});
          }}
        />
        <Button
          label="فارسی"
          secondary={settings.locale !== 'fa'}
          onPress={() => {
            void updateSettings(services, {locale: 'fa'});
          }}
        />
      </Row>
      <Text kind="title">{t('accessibility')}</Text>
      {(['reduceMotion', 'reduceTransparency', 'highContrast'] as const).map(key => (
        <Row key={key} style={styles.between}>
          <View style={styles.fill}>
            <Text>{t(key)}</Text>
          </View>
          <Switch
            accessibilityLabel={t(key)}
            value={settings[key]}
            onValueChange={value => {
              void updateSettings(services, {[key]: value});
            }}
          />
        </Row>
      ))}
      <Surface>
        <Text kind="title">{t('privacy')}</Text>
        <Text muted>{t('privacyBody')}</Text>
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
          <Text accessibilityLiveRegion="polite">{message}</Text>
          <Text kind="caption">RN 0.87.1 · SQLite schema 1 · ManagedMedia v1</Text>
        </Surface>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  between: {justifyContent: 'space-between', minHeight: tokens.size.touch},
  fill: {flex: 1},
});
