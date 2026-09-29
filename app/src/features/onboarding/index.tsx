import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Artwork, Button, Page, Row, Text, tokens} from '../../design-system';
import {updateSettings, useServices} from '../../app/providers/Services';
export function OnboardingScreen() {
  const {t} = useTranslation();
  const services = useServices();
  return (
    <Page>
      <Row>
        <Button
          secondary
          label="English"
          onPress={() => {
            void updateSettings(services, {locale: 'en'});
          }}
        />
        <Button
          secondary
          label="فارسی"
          onPress={() => {
            void updateSettings(services, {locale: 'fa'});
          }}
        />
      </Row>
      <View style={styles.hero}>
        <Artwork seed="a-private-home" large />
        <Text kind="display">{t('welcomeTitle')}</Text>
        <Text>{t('welcomeBody')}</Text>
        <Text muted>{t('welcomeDetail')}</Text>
        <Button
          label={t('start')}
          icon="arrow"
          testID="onboarding-start"
          onPress={() => {
            void updateSettings(services, {onboarded: true});
          }}
        />
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  hero: {gap: tokens.spacing.xl, paddingVertical: tokens.spacing.hero},
});
