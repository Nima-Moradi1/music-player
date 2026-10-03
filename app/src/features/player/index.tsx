import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {useStore} from 'zustand';
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
import type {PlaybackController} from '../../domain/playback/PlaybackController';

function clock(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}

function PlayerControls({audio, track}: {audio: PlaybackController; track: Track}) {
  const {t} = useTranslation();
  const playback = useStore(audio.state);
  const active = playback.trackId === track.id;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function action(work: () => Promise<void>) {
    if (pending) {
      return;
    }
    setPending(true);
    setError(false);
    try {
      await work();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <Surface variant="player">
      <Text kind="title">{t('nowPlaying')}</Text>
      <Text muted accessibilityLiveRegion="polite">
        {active
          ? `${clock(playback.positionMs)} / ${clock(playback.durationMs)}`
          : clock(track.durationMs)}
      </Text>
      <Row style={styles.controls}>
        <Button
          label={active && playback.playing ? t('pause') : t('play')}
          disabled={pending}
          onPress={() => {
            void action(() => (active ? audio.toggle() : audio.playTrack(track)));
          }}
        />
        {active && (
          <Button
            label={t('backTen')}
            secondary
            disabled={pending}
            onPress={() => {
              void action(() => audio.seekTo(playback.positionMs - 10000));
            }}
          />
        )}
      </Row>
      {active && (
        <Row style={styles.controls}>
          <Button
            label={t('previousTrack')}
            secondary
            disabled={pending}
            onPress={() => {
              void action(() => audio.previous());
            }}
          />
          <Button
            label={t('forwardTen')}
            secondary
            disabled={pending}
            onPress={() => {
              void action(() => audio.seekTo(playback.positionMs + 10000));
            }}
          />
          <Button
            label={t('nextTrack')}
            secondary
            disabled={pending || playback.queue.indexOf(track.id) >= playback.queue.length - 1}
            onPress={() => {
              void action(() => audio.next());
            }}
          />
        </Row>
      )}
      {!active && playback.trackId && (
        <Button
          label={t('addToQueue')}
          secondary
          disabled={pending || playback.queue.includes(track.id)}
          onPress={() => {
            audio.enqueue(track);
          }}
        />
      )}
      {active && <Text muted>{t('queueCount', {count: playback.queue.length})}</Text>}
      {active && (
        <Button
          label={t(`repeat_${playback.repeatMode}`)}
          secondary
          disabled={pending}
          onPress={() => {
            audio.setRepeatMode(
              playback.repeatMode === 'off' ? 'all' : playback.repeatMode === 'all' ? 'one' : 'off',
            );
          }}
        />
      )}
      {active && (
        <Row style={styles.controls}>
          <Button
            label={playback.sleepUntilMs ? t('cancelSleep') : t('sleepThirty')}
            secondary
            disabled={pending}
            onPress={() => {
              void action(() => audio.setSleepTimer(playback.sleepUntilMs ? 0 : 30));
            }}
          />
          <Button
            label={
              playback.repeatEndMs !== null
                ? t('clearAB')
                : playback.repeatStartMs !== null
                  ? t('markB')
                  : t('markA')
            }
            secondary
            disabled={
              pending ||
              (playback.repeatStartMs !== null &&
                playback.repeatEndMs === null &&
                playback.positionMs <= playback.repeatStartMs)
            }
            onPress={() => {
              void action(() => {
                if (playback.repeatEndMs !== null) {
                  return audio.setABRepeat(null, null);
                }
                if (playback.repeatStartMs !== null) {
                  return audio.setABRepeat(playback.repeatStartMs, playback.positionMs);
                }
                return audio.markRepeatStart(playback.positionMs);
              });
            }}
          />
        </Row>
      )}
      {error && <Text accessibilityLiveRegion="polite">{t('playbackFailed')}</Text>}
    </Surface>
  );
}
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
      {track.managedPath && services.audio ? (
        <PlayerControls audio={services.audio} track={track} />
      ) : (
        <Surface>
          <Text>{track.managedPath ? t('playbackFailed') : t('fixtureBody')}</Text>
        </Surface>
      )}
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
  controls: {flexWrap: 'wrap'},
  metadata: {flexWrap: 'wrap', gap: tokens.spacing.sm},
  value: {flexShrink: 1},
});
