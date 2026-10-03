import React, {useEffect, useRef, useState} from 'react';
import {Modal, StyleSheet, View, type GestureResponderEvent} from 'react-native';
import {useStore} from 'zustand';
import {useTranslation} from 'react-i18next';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
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
  useTheme,
} from '../../design-system';
import {refreshLibrary, useLibraryVersion, useServices} from '../../app/providers/Services';
import type {RootStackParamList} from '../../app/navigation/types';
import type {Track, Language} from '../../domain/track';
import type {Playlist} from '../../domain/playlist';
import type {PlaybackController} from '../../domain/playback/PlaybackController';

function clock(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}

function SeekBar({
  positionMs,
  durationMs,
  disabled,
  onSeek,
}: {
  positionMs: number;
  durationMs: number;
  disabled: boolean;
  onSeek: (ms: number) => void;
}) {
  const {colors, rtl} = useTheme();
  const {t} = useTranslation();
  const [width, setWidth] = useState(1);
  const [preview, setPreview] = useState<number | null>(null);
  const position = preview ?? positionMs;
  function value(event: GestureResponderEvent) {
    const fraction = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
    return Math.round((rtl ? 1 - fraction : fraction) * durationMs);
  }
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('seekPosition')}
      accessibilityValue={{min: 0, max: durationMs, now: position}}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={event => {
        if (disabled) return;
        const delta = event.nativeEvent.actionName === 'increment' ? 10000 : -10000;
        onSeek(Math.max(0, Math.min(durationMs, position + delta)));
      }}
      onLayout={event => setWidth(Math.max(1, event.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => !disabled && durationMs > 0}
      onMoveShouldSetResponder={() => !disabled && durationMs > 0}
      onResponderGrant={event => setPreview(value(event))}
      onResponderMove={event => setPreview(value(event))}
      onResponderRelease={event => {
        onSeek(value(event));
        setPreview(null);
      }}
      onResponderTerminate={() => setPreview(null)}
      style={[styles.seekTrack, {backgroundColor: colors.elevated}]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.seekFill,
          {
            width: `${durationMs ? (100 * position) / durationMs : 0}%`,
            backgroundColor: colors.accent,
          },
          rtl ? styles.seekRight : styles.seekLeft,
        ]}
      />
    </View>
  );
}

function QueueSheet({
  audio,
  visible,
  close,
}: {
  audio: PlaybackController;
  visible: boolean;
  close: () => void;
}) {
  const {t} = useTranslation();
  const playback = useStore(audio.state);
  const {tracks} = useServices();
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    Promise.all(playback.queue.map(id => tracks.get(id)))
      .then(items => {
        if (alive) {
          setTitles(
            Object.fromEntries(items.filter(Boolean).map(track => [track!.id, track!.title])),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [visible, playback.queue, tracks]);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <Page>
        <Text kind="heading">{t('playQueue')}</Text>
        <Button label={t('close')} secondary onPress={close} />
        {playback.queue.map(id => (
          <Surface key={id}>
            <Text kind="title">
              {titles[id] ?? (id === playback.trackId ? playback.title : t('loading'))}
            </Text>
            <Row style={styles.controls}>
              <Button
                label={id === playback.trackId ? t('nowPlaying') : t('play')}
                disabled={id === playback.trackId}
                onPress={() => {
                  void audio
                    .skipTo(id)
                    .then(close)
                    .catch(() => undefined);
                }}
              />
              <Button
                label={t('removeFromQueue')}
                secondary
                disabled={id === playback.trackId}
                onPress={() => audio.removeFromQueue(id)}
              />
            </Row>
          </Surface>
        ))}
      </Page>
    </Modal>
  );
}

function PlayerControls({audio, track}: {audio: PlaybackController; track: Track}) {
  const {t} = useTranslation();
  const playback = useStore(audio.state);
  const active = playback.trackId === track.id;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
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
      {active && (
        <SeekBar
          positionMs={playback.positionMs}
          durationMs={playback.durationMs}
          disabled={pending}
          onSeek={ms => {
            void action(() => audio.seekTo(ms));
          }}
        />
      )}
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
      {active && (
        <Button
          label={t('queueCount', {count: playback.queue.length})}
          secondary
          onPress={() => setQueueOpen(true)}
        />
      )}
      {active && (
        <Button
          label={t('shuffle')}
          secondary={!playback.shuffle}
          selected={playback.shuffle}
          onPress={() => audio.setShuffle(!playback.shuffle)}
        />
      )}
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
        <Button
          label={t('playbackSpeed', {rate: playback.rate})}
          secondary
          disabled={pending}
          onPress={() => {
            void action(() =>
              audio.setRate(
                playback.rate === 1
                  ? 1.25
                  : playback.rate === 1.25
                    ? 1.5
                    : playback.rate === 1.5
                      ? 2
                      : 1,
              ),
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
      <QueueSheet audio={audio} visible={queueOpen} close={() => setQueueOpen(false)} />
    </Surface>
  );
}
export function TrackDetailsScreen({route}: NativeStackScreenProps<RootStackParamList, 'Details'>) {
  const services = useServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      <Button
        label={t('lyrics')}
        secondary
        onPress={() => navigation.navigate('Lyrics', {trackId: track.id})}
      />
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
      {(['fa', 'en', 'ar', 'es', 'de', 'it', 'other'] as Language[]).map(language => (
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
  seekTrack: {
    height: tokens.size.touch,
    justifyContent: 'center',
    borderRadius: tokens.radius.small,
    overflow: 'hidden',
  },
  seekFill: {height: 8, borderRadius: tokens.radius.pill},
  seekLeft: {alignSelf: 'flex-start'},
  seekRight: {alignSelf: 'flex-end'},
  metadata: {flexWrap: 'wrap', gap: tokens.spacing.sm},
  value: {flexShrink: 1},
});
