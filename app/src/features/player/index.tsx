import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Artwork,
  Button,
  Loading,
  Page,
  Row,
  Surface,
  Text,
  EmptyState,
  tokens,
} from '../../design-system';
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
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const busy = useRef(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
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
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [services, route.params.trackId, version]);
  async function change(work: () => Promise<void>, message = '') {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setPending(true);
    setFeedback('');
    try {
      await work();
      setError(false);
      setFeedback(message);
      refreshLibrary(services);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  if (!track) {
    return (
      <Page>
        {error ? (
          <EmptyState
            title={t('errorTitle')}
            body={t('errorBody')}
            action={<Button label={t('retry')} onPress={() => refreshLibrary(services)} />}
          />
        ) : loading ? (
          <Loading label={t('loading')} />
        ) : (
          <EmptyState title={t('trackDetails')} body={t('trackMissing')} />
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
      {error && (
        <>
          <Text accessibilityLiveRegion="polite">{t('actionFailed')}</Text>
          <Button label={t('retry')} onPress={() => refreshLibrary(services)} />
        </>
      )}
      {!!feedback && <Text accessibilityLiveRegion="polite">{feedback}</Text>}
      <Button
        disabled={pending || loading}
        icon="heart"
        label={t(track.favorite ? 'unfavorite' : 'favorite')}
        secondary={!track.favorite}
        onPress={() => {
          void change(() => services.tracks.setFavorite(track.id, !track.favorite));
        }}
      />
      <Surface>
        <Row style={styles.metadata}>
          <Text muted>{t('format')}</Text>
          <Text style={styles.value}>{track.extension.toUpperCase()}</Text>
        </Row>
        <Row style={styles.metadata}>
          <Text muted>{t('duration')}</Text>
          <Text>
            {Math.floor(track.durationMs / 60000)}:
            {String(Math.floor(track.durationMs / 1000) % 60).padStart(2, '0')}
          </Text>
        </Row>
        <Row style={styles.metadata}>
          <Text muted>{t('fileSize')}</Text>
          <Text style={styles.value}>{(track.fileSize / 1048576).toFixed(1)} MB</Text>
        </Row>
        <Row style={styles.metadata}>
          <Text muted>{t('albums')}</Text>
          <Text style={styles.value}>{track.album || t('unknownAlbum')}</Text>
        </Row>
      </Surface>
      <Text kind="title">{t('correction')}</Text>
      <Text muted>{t('correctionBody')}</Text>
      {(['fa', 'en', 'ar', 'es', 'other'] as Language[]).map(language => (
        <Button
          key={language}
          disabled={pending || loading}
          selected={track.language === language}
          secondary={track.language !== language}
          label={t(language)}
          onPress={() => {
            void change(() => services.tracks.setLanguage(track.id, language));
          }}
        />
      ))}
      <Text kind="title">{t('addToPlaylist')}</Text>
      {!playlists.length && <Text muted>{t('playlistChoose')}</Text>}
      {playlists.map(playlist => (
        <Button
          key={playlist.id}
          disabled={pending || loading}
          secondary
          label={playlist.name}
          onPress={() => {
            void change(
              () => services.playlists.addTrack(playlist.id, track.id),
              t('playlistAdded', {name: playlist.name}),
            );
          }}
        />
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  metadata: {flexWrap: 'wrap', gap: tokens.spacing.sm},
  value: {flexShrink: 1},
});
