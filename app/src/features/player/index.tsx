import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Artwork, Button, Loading, Page, Row, Surface, Text, EmptyState} from '../../design-system';
import {refreshLibrary, useLibraryVersion, useServices} from '../../app/providers/Services';
import type {RootStackParamList} from '../../app/navigation/types';
import type {Track, Language} from '../../domain/track';
import type {Playlist} from '../../domain/playlist';
export function TrackDetailsScreen({route}: NativeStackScreenProps<RootStackParamList, 'Details'>) {
  const services = useServices();
  const {t} = useTranslation();
  const version = useLibraryVersion();
  const [track, setTrack] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([services.tracks.get(route.params.trackId), services.playlists.list()])
      .then(([song, lists]) => {
        if (alive) {
          setTrack(song);
          setPlaylists(lists);
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [services, route.params.trackId, version]);
  async function change(work: () => Promise<void>) {
    try {
      await work();
      setError(false);
      refreshLibrary(services);
    } catch {
      setError(true);
    }
  }
  if (!track) {
    return (
      <Page>
        {error ? (
          <EmptyState title={t('errorTitle')} body={t('errorBody')} />
        ) : (
          <Loading label={t('loading')} />
        )}
      </Page>
    );
  }
  return (
    <Page>
      <Artwork seed={track.id} uri={track.artworkPath} large />
      <Text kind="heading">{track.title}</Text>
      <Text muted>{track.artist || t('unknownArtist')}</Text>
      <Surface>
        <Text>{t('phase2')}</Text>
      </Surface>
      {error && <Text accessibilityLiveRegion="polite">{t('errorTitle')}</Text>}
      <Button
        icon="heart"
        label={t(track.favorite ? 'unfavorite' : 'favorite')}
        secondary={!track.favorite}
        onPress={() => {
          void change(() => services.tracks.setFavorite(track.id, !track.favorite));
        }}
      />
      <Surface>
        <Row>
          <Text muted>{t('format')}</Text>
          <Text>{track.extension.toUpperCase()}</Text>
        </Row>
        <Row>
          <Text muted>{t('duration')}</Text>
          <Text>
            {Math.floor(track.durationMs / 60000)}:
            {String(Math.floor(track.durationMs / 1000) % 60).padStart(2, '0')}
          </Text>
        </Row>
        <Row>
          <Text muted>{t('fileSize')}</Text>
          <Text>{(track.fileSize / 1048576).toFixed(1)} MB</Text>
        </Row>
        <Row>
          <Text muted>{t('albums')}</Text>
          <Text>{track.album || t('unknownAlbum')}</Text>
        </Row>
      </Surface>
      <Text kind="title">{t('correction')}</Text>
      <Text muted>{t('correctionBody')}</Text>
      {(['fa', 'en', 'ar', 'es', 'other'] as Language[]).map(language => (
        <Button
          key={language}
          secondary={track.language !== language}
          label={t(language)}
          onPress={() => {
            void change(() => services.tracks.setLanguage(track.id, language));
          }}
        />
      ))}
      <Text kind="title">{t('addToPlaylist')}</Text>
      {playlists.map(playlist => (
        <Button
          key={playlist.id}
          secondary
          label={playlist.name}
          onPress={() => {
            void change(() => services.playlists.addTrack(playlist.id, track.id));
          }}
        />
      ))}
    </Page>
  );
}
