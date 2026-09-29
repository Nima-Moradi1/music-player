import React, {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, EmptyState, Input, Row, Text, tokens, TrackRow} from '../../design-system';
import {refreshLibrary, useLibraryVersion, useServices} from '../../app/providers/Services';
import type {Playlist} from '../../domain/playlist';
import type {Track} from '../../domain/track';
import type {RootStackParamList} from '../../app/navigation/types';
export function PlaylistsScreen() {
  const {t} = useTranslation();
  const services = useServices();
  const version = useLibraryVersion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [items, setItems] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    services.playlists
      .list()
      .then(result => {
        if (alive) {
          setPlaylists(result);
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
  }, [services, version]);
  useEffect(() => {
    let alive = true;
    setItems([]);
    if (selected) {
      services.playlists
        .tracks(selected.id)
        .then(result => {
          if (alive) {
            setItems(result);
          }
        })
        .catch(() => {
          if (alive) {
            setError(true);
          }
        });
    }
    return () => {
      alive = false;
    };
  }, [services, selected, version]);
  async function mutate(work: () => Promise<void>) {
    try {
      await work();
      setName('');
      setError(false);
      refreshLibrary(services);
    } catch {
      setError(true);
    }
  }
  return (
    <View style={styles.fill}>
      {error && <Text accessibilityLiveRegion="polite">{t('errorTitle')}</Text>}
      <Input
        value={name}
        onChangeText={setName}
        placeholder={t('playlistName')}
        label={t('playlistName')}
      />
      <Row>
        <Button
          label={t('newPlaylist')}
          disabled={!name.trim()}
          onPress={() => {
            void mutate(async () => services.playlists.create(await services.createId(), name));
          }}
        />
        {selected && (
          <Button
            secondary
            label={t('rename')}
            disabled={!name.trim()}
            onPress={() => {
              void mutate(async () => {
                await services.playlists.rename(selected.id, name);
                setSelected({...selected, name: name.trim()});
              });
            }}
          />
        )}
      </Row>
      {selected ? (
        <>
          <Row>
            <Button secondary label={t('back')} onPress={() => setSelected(null)} />
            <Text kind="title">{selected.name}</Text>
          </Row>
          <Button
            secondary
            label={t('delete')}
            onPress={() =>
              Alert.alert(t('deletePlaylist'), t('deletePlaylistBody'), [
                {text: t('cancel'), style: 'cancel'},
                {
                  text: t('delete'),
                  style: 'destructive',
                  onPress: () => {
                    void mutate(async () => {
                      await services.playlists.delete(selected.id);
                      setSelected(null);
                    });
                  },
                },
              ])
            }
          />
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            onEndReached={() => {
              if (items.length % 60 === 0 && items.length) {
                void services.playlists
                  .tracks(selected.id, items.length)
                  .then(page => setItems(previous => [...previous, ...page]));
              }
            }}
            renderItem={({item}) => (
              <View>
                <TrackRow
                  track={item}
                  onPress={() => navigation.navigate('Details', {trackId: item.id})}
                  onFavorite={() => {
                    void mutate(() => services.tracks.setFavorite(item.id, !item.favorite));
                  }}
                />
                <Button
                  secondary
                  label={t('removeFromPlaylist')}
                  onPress={() => {
                    void mutate(() => services.playlists.removeTrack(selected.id, item.id));
                  }}
                />
              </View>
            )}
            ListEmptyComponent={
              <EmptyState title={t('playlistEmpty')} body={t('playlistEmptyBody')} />
            }
          />
        </>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.collection}>
              <Button
                secondary
                label={`${item.name} · ${item.count}`}
                onPress={() => setSelected(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title={t('playlistEmpty')} body={t('playlistEmptyBody')} />
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  fill: {flex: 1, gap: tokens.spacing.lg},
  collection: {paddingVertical: tokens.spacing.sm},
});
