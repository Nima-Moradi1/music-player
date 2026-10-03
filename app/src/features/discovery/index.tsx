import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, EmptyState, Loading, Page, Surface, Text, TrackRow} from '../../design-system';
import {
  refreshLibrary,
  runLibraryCommand,
  useLibraryVersion,
  useSelectedTrackId,
  useServices,
  useSettings,
} from '../../app/providers/Services';
import type {RootStackParamList} from '../../app/navigation/types';
import {recommendLocal, type LocalRecommendation} from '../../domain/recommendations';

export function DiscoveryScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const services = useServices();
  const selectedId = useSelectedTrackId();
  const version = useLibraryVersion();
  const {locale} = useSettings();
  const [items, setItems] = useState<LocalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    Promise.all([
      selectedId ? services.tracks.get(selectedId) : Promise.resolve(null),
      services.tracks.list({dimension: 'favorites', limit: 1}),
      services.tracks.list({limit: 200}),
    ])
      .then(([selected, favorites, tracks]) => {
        if (alive) {
          const anchor = selected ?? favorites[0] ?? tracks.find(track => !!track.managedPath);
          setItems(anchor ? recommendLocal(anchor, tracks, locale) : []);
        }
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [services, selectedId, version, locale]);
  return (
    <Page>
      <Text kind="heading">{t('discover')}</Text>
      <Surface>
        <Text muted>{t('discoverLocalBody')}</Text>
      </Surface>
      {error ? (
        <EmptyState
          title={t('errorTitle')}
          body={t('errorBody')}
          action={<Button label={t('retry')} onPress={() => refreshLibrary(services)} />}
        />
      ) : loading ? (
        <Loading label={t('loading')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('discoverEmptyTitle')} body={t('discoverEmptyBody')} />
      ) : (
        items.map(({track, reason}) => (
          <React.Fragment key={track.id}>
            <TrackRow
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
            <Text kind="caption" muted>
              {t(`related_${reason}`)}
            </Text>
          </React.Fragment>
        ))
      )}
    </Page>
  );
}
