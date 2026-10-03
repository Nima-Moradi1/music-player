import React, {useEffect, useRef, useState} from 'react';
import {Linking} from 'react-native';
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
import type {Track} from '../../domain/track';
import {
  findRelatedRecordings,
  type OnlineRecording,
} from '../../infrastructure/recommendations/musicBrainz';

export function DiscoveryScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const services = useServices();
  const selectedId = useSelectedTrackId();
  const version = useLibraryVersion();
  const {locale} = useSettings();
  const [items, setItems] = useState<LocalRecommendation[]>([]);
  const [anchor, setAnchor] = useState<Track | null>(null);
  const [onlineItems, setOnlineItems] = useState<OnlineRecording[]>([]);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [onlineSearched, setOnlineSearched] = useState(false);
  const [onlineError, setOnlineError] = useState(false);
  const onlineRequest = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    onlineRequest.current?.abort();
    setOnlineItems([]);
    setOnlineBusy(false);
    setOnlineSearched(false);
    setOnlineError(false);
    setLoading(true);
    setError(false);
    Promise.all([
      selectedId ? services.tracks.get(selectedId) : Promise.resolve(null),
      services.tracks.firstPlayable(true),
      services.tracks.firstPlayable(),
    ])
      .then(async ([selected, favorite, first]) => {
        const activeTrack = (selected?.managedPath ? selected : null) ?? favorite ?? first;
        const tracks = activeTrack ? await services.tracks.relatedCandidates(activeTrack) : [];
        if (alive) {
          setAnchor(activeTrack);
          setItems(activeTrack ? recommendLocal(activeTrack, tracks, locale) : []);
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
      onlineRequest.current?.abort();
    };
  }, [services, selectedId, version, locale]);
  function searchOnline() {
    if (!anchor || onlineBusy) return;
    const request = new AbortController();
    onlineRequest.current = request;
    setOnlineBusy(true);
    setOnlineError(false);
    void findRelatedRecordings(anchor, request.signal)
      .then(result => {
        if (!request.signal.aborted) {
          setOnlineItems(result);
          setOnlineSearched(true);
        }
      })
      .catch(() => {
        if (!request.signal.aborted) setOnlineError(true);
      })
      .finally(() => {
        if (!request.signal.aborted) setOnlineBusy(false);
      });
  }
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
      {anchor && (
        <Surface>
          <Text kind="title">{t('onlineRelatedTitle')}</Text>
          <Text muted>{t('onlineRelatedBody')}</Text>
          <Button
            label={onlineBusy ? t('loading') : t('onlineRelatedButton')}
            disabled={onlineBusy}
            onPress={searchOnline}
          />
          {onlineError && <Text accessibilityLiveRegion="polite">{t('onlineRelatedError')}</Text>}
          {onlineSearched && !onlineItems.length && <Text muted>{t('onlineRelatedEmpty')}</Text>}
          {onlineItems.map(item => (
            <Surface key={item.id}>
              <Text kind="title">{item.title}</Text>
              <Text>{item.artist}</Text>
              <Text kind="caption" muted>
                {t(`related_${item.reason}`)}
              </Text>
              <Button
                label={t('viewRecording')}
                secondary
                onPress={() => {
                  void Linking.openURL(item.sourceUrl).catch(() => setOnlineError(true));
                }}
              />
            </Surface>
          ))}
        </Surface>
      )}
    </Page>
  );
}
