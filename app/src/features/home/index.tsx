import React, {useEffect, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Artwork,
  Button,
  IconButton,
  Page,
  Row,
  Surface,
  Text,
  tokens,
  TrackRow,
} from '../../design-system';
import type {RootStackParamList} from '../../app/navigation/types';
import {useLibraryVersion, useServices, runLibraryCommand} from '../../app/providers/Services';
import {useTracks} from '../../app/providers/useTracks';
import {ImportButton} from '../imports';
export function HomeScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const services = useServices();
  const version = useLibraryVersion();
  const [count, setCount] = useState(0);
  const {width, fontScale} = useWindowDimensions();
  const recent = useTracks({sort: 'recent', limit: 5});
  useEffect(() => {
    let active = true;
    services.tracks
      .count()
      .then(value => {
        if (active) {
          setCount(value);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [services, version]);
  return (
    <Page>
      <Row style={styles.between}>
        <Text kind="label">{t('appName')}</Text>
        <IconButton
          name="settings"
          label={t('settings')}
          onPress={() => navigation.navigate('Settings')}
        />
      </Row>
      <View style={styles.hero}>
        <Text kind="display">{t('greeting')}</Text>
        <Text muted>{t('homeCaption')}</Text>
      </View>
      <Surface>
        <Row style={width < tokens.size.page / 2 || fontScale > 1.3 ? styles.stack : undefined}>
          <Artwork seed="quiet-local-music" large />
          <View style={styles.copy}>
            <Text kind="caption">{t('localFirst')}</Text>
            <Text kind="heading">{t('songCount', {count})}</Text>
            <Text muted>{t('localCaption')}</Text>
          </View>
        </Row>
      </Surface>
      <ImportButton />
      {!!recent.items.length && (
        <View>
          <Text kind="title">{t('recent')}</Text>
          {recent.items.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              onPress={() => {
                services.state.setState({selectedTrackId: track.id});
                navigation.navigate('Details', {trackId: track.id});
              }}
              onFavorite={() => {
                void runLibraryCommand(services, () =>
                  services.tracks.setFavorite(track.id, !track.favorite),
                );
              }}
            />
          ))}
        </View>
      )}
      <Button
        secondary
        label={t('privacy')}
        icon="lock"
        onPress={() => navigation.navigate('Settings')}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  between: {justifyContent: 'space-between'},
  hero: {gap: tokens.spacing.md, paddingVertical: tokens.spacing.lg},
  copy: {flex: 1, gap: tokens.spacing.md},
  stack: {flexDirection: 'column', alignItems: 'flex-start'},
});
