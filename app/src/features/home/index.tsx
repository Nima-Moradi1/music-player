import React, {useEffect, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Artwork,
  Button,
  IconButton,
  EmptyState,
  Loading,
  Page,
  Row,
  Surface,
  Text,
  tokens,
  TrackRow,
} from '../../design-system';
import type {RootStackParamList} from '../../app/navigation/types';
import {
  useLibraryVersion,
  useServices,
  runLibraryCommand,
  refreshLibrary,
} from '../../app/providers/Services';
import {useTracks} from '../../app/providers/useTracks';
import {ImportButton} from '../imports';
export function HomeScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const services = useServices();
  const version = useLibraryVersion();
  const [count, setCount] = useState<number | null>(null);
  const [countError, setCountError] = useState(false);
  const {width, fontScale} = useWindowDimensions();
  const recent = useTracks({sort: 'recent', limit: 5});
  useEffect(() => {
    let active = true;
    setCountError(false);
    services.tracks
      .count()
      .then(value => {
        if (active) {
          setCount(value);
        }
      })
      .catch(() => {
        if (active) {
          setCountError(true);
        }
      });
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
            <Text kind="heading">{count === null ? t('loading') : t('songCount', {count})}</Text>
            <Text muted>{t('localCaption')}</Text>
          </View>
        </Row>
      </Surface>
      <ImportButton />
      {countError || recent.error ? (
        <EmptyState
          title={t('errorTitle')}
          body={t('errorBody')}
          action={<Button label={t('retry')} onPress={() => refreshLibrary(services)} />}
        />
      ) : recent.loading ? (
        <Loading label={t('loading')} />
      ) : !recent.items.length ? (
        <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
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
  between: {justifyContent: 'space-between', flexWrap: 'wrap'},
  hero: {gap: tokens.spacing.md, paddingVertical: tokens.spacing.lg},
  copy: {flex: 1, gap: tokens.spacing.md},
  stack: {flexDirection: 'column', alignItems: 'flex-start'},
});
