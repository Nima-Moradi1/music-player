import React, {useEffect, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  Row,
  Sheet,
  Skeleton,
  Text,
  Toast,
  tokens,
  TrackRow,
  useHaptics,
} from '../../design-system';
import {refreshLibrary, useLibraryVersion, useServices} from '../../app/providers/Services';
import type {Playlist} from '../../domain/playlist';
import type {Track} from '../../domain/track';
import type {RootStackParamList} from '../../app/navigation/types';

const PAGE_SIZE = 60;
export function PlaylistsScreen({header}: {header?: React.ReactElement | null}) {
  const {t} = useTranslation();
  const services = useServices();
  const version = useLibraryVersion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const haptic = useHaptics();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [items, setItems] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [editor, setEditor] = useState<'create' | 'rename' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageError, setPageError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState('');
  const [mutationError, setMutationError] = useState(false);
  const offset = useRef(0);
  const [hasMore, setHasMore] = useState(false);
  const paging = useRef(false);
  const writing = useRef(false);
  const generation = useRef(0);
  const selectedId = selected?.id;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const current = ++generation.current;
    let alive = true;
    setLoading(true);
    setError(false);
    setPageError(false);
    paging.current = false;
    const query = selectedId
      ? services.playlists.tracks(selectedId).then(result => {
          if (alive && current === generation.current) {
            setItems(result);
            offset.current = result.length;
            setHasMore(result.length === PAGE_SIZE);
          }
        })
      : services.playlists.list().then(result => {
          if (alive && current === generation.current) {
            setPlaylists(result);
          }
        });
    void query
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
  }, [services, selectedId, version, retry]);

  async function loadMore() {
    if (!selectedId || !hasMore || paging.current || loading) {
      return;
    }
    paging.current = true;
    setPageError(false);
    const current = generation.current;
    try {
      const page = await services.playlists.tracks(selectedId, offset.current);
      if (mounted.current && current === generation.current) {
        offset.current += page.length;
        setItems(previous => [...previous, ...page]);
        setHasMore(page.length === PAGE_SIZE);
      }
    } catch {
      if (mounted.current && current === generation.current) {
        setPageError(true);
      }
    } finally {
      if (current === generation.current) {
        paging.current = false;
      }
    }
  }
  async function mutate(work: () => Promise<void>, success: string) {
    if (writing.current) {
      return;
    }
    writing.current = true;
    setBusy(true);
    setMutationError(false);
    try {
      await work();
      if (mounted.current) {
        setEditor(null);
        setDeleting(false);
        setMessage(success);
        setError(false);
        haptic('success');
      }
      refreshLibrary(services);
    } catch {
      if (mounted.current) {
        setMessage(t('actionFailed'));
        setMutationError(true);
        haptic('error');
      }
    } finally {
      writing.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  }
  const controls = (
    <View style={styles.controls}>
      {header}
      <Button
        label={t('newPlaylist')}
        onPress={() => {
          setName('');
          setMutationError(false);
          setEditor('create');
        }}
      />
      {selected && (
        <>
          <Button
            secondary
            label={t('back')}
            onPress={() => {
              setItems([]);
              setSelected(null);
            }}
          />
          <Text kind="title" accessibilityRole="header">
            {selected.name}
          </Text>
          <Row style={styles.actions}>
            <Button
              secondary
              label={t('rename')}
              onPress={() => {
                setName(selected.name);
                setMutationError(false);
                setEditor('rename');
              }}
            />
            <Button
              secondary
              label={t('delete')}
              onPress={() => {
                setMutationError(false);
                setDeleting(true);
              }}
            />
          </Row>
        </>
      )}
      {error && (
        <>
          <Text accessibilityLiveRegion="polite">{t('errorTitle')}</Text>
          <Button label={t('retry')} onPress={() => setRetry(value => value + 1)} />
        </>
      )}
      {loading && <Skeleton label={t('loading')} />}
    </View>
  );
  return (
    <View style={styles.fill}>
      {selected ? (
        <FlatList
          data={loading || error ? [] : items}
          ListHeaderComponent={controls}
          keyExtractor={item => item.id}
          onEndReached={() => {
            if (!pageError) {
              void loadMore();
            }
          }}
          renderItem={({item}) => (
            <View>
              <TrackRow
                track={item}
                onPress={() => navigation.navigate('Details', {trackId: item.id})}
                onFavorite={() => {
                  void mutate(
                    () => services.tracks.setFavorite(item.id, !item.favorite),
                    t(item.favorite ? 'unfavorite' : 'favorite'),
                  );
                }}
              />
              <Button
                secondary
                label={`${t('removeFromPlaylist')}: ${item.title}`}
                disabled={busy}
                onPress={() => {
                  void mutate(
                    () => services.playlists.removeTrack(selected.id, item.id),
                    t('playlistRemoved'),
                  );
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            !loading && !error ? (
              <EmptyState title={t('playlistEmpty')} body={t('playlistEmptyBody')} />
            ) : undefined
          }
          ListFooterComponent={
            pageError ? (
              <Button
                label={t('retry')}
                onPress={() => {
                  void loadMore();
                }}
              />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={loading || error ? [] : playlists}
          ListHeaderComponent={controls}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.collection}>
              <Button
                secondary
                label={`${item.name} · ${item.count}`}
                onPress={() => {
                  setItems([]);
                  setSelected(item);
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            !loading && !error ? (
              <EmptyState title={t('playlistEmpty')} body={t('playlistEmptyBody')} />
            ) : undefined
          }
        />
      )}
      <Toast
        message={message}
        tone={mutationError ? 'error' : 'status'}
        dismissLabel={t('dismiss')}
        onDismiss={() => setMessage('')}
      />
      <Sheet
        visible={editor !== null}
        title={t(editor === 'rename' ? 'rename' : 'newPlaylist')}
        closeLabel={t('cancel')}
        dismissible={!busy}
        onClose={() => setEditor(null)}
      >
        {mutationError && (
          <Text accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {t('actionFailed')}
          </Text>
        )}
        <Input
          value={name}
          onChangeText={setName}
          label={t('playlistName')}
          placeholder={t('playlistName')}
        />
        <Button
          label={t('save')}
          disabled={busy || !name.trim()}
          onPress={() => {
            void mutate(async () => {
              if (editor === 'rename' && selected) {
                await services.playlists.rename(selected.id, name.trim());
                if (mounted.current) {
                  setSelected({...selected, name: name.trim()});
                }
              } else {
                await services.playlists.create(await services.createId(), name.trim());
              }
            }, t('playlistSaved'));
          }}
        />
      </Sheet>
      <Dialog
        visible={deleting}
        title={t('deletePlaylist')}
        body={t('deletePlaylistBody')}
        error={mutationError ? t('actionFailed') : ''}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        busy={busy}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          if (selected) {
            void mutate(async () => {
              await services.playlists.delete(selected.id);
              if (mounted.current) {
                setSelected(null);
              }
            }, t('playlistDeleted'));
          }
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  fill: {flex: 1, gap: tokens.spacing.lg},
  controls: {gap: tokens.spacing.lg, paddingBottom: tokens.spacing.lg},
  actions: {flexWrap: 'wrap'},
  collection: {paddingVertical: tokens.spacing.sm},
});
