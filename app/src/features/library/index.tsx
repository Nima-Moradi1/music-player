import React, {useEffect, useState} from 'react';
import {FlatList, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Loading,
  Page,
  Row,
  Text,
  tokens,
  TrackRow,
} from '../../design-system';
import {refreshLibrary, useLibraryVersion, useServices} from '../../app/providers/Services';
import {useTracks} from '../../app/providers/useTracks';
import type {BrowseDimension, Collection, LibraryQuery} from '../../domain/track';
import type {RootStackParamList} from '../../app/navigation/types';
import {ImportButton} from '../imports';
import {PlaylistsScreen} from '../playlists';
const dimensions: (BrowseDimension | 'playlists')[] = [
  'songs',
  'artists',
  'albums',
  'genres',
  'sources',
  'languages',
  'playlists',
  'favorites',
  'recent',
  'played',
  'mostPlayed',
  'telegram',
];
const grouped: BrowseDimension[] = ['artists', 'albums', 'genres', 'sources', 'languages'];
export function LibraryScreen() {
  const {t} = useTranslation();
  const services = useServices();
  const version = useLibraryVersion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dimension, setDimension] = useState<BrowseDimension | 'playlists'>('songs');
  const [value, setValue] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<LibraryQuery['sort']>('title');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionError, setCollectionError] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 100);
    return () => clearTimeout(timer);
  }, [search]);
  const tracks = useTracks({
    dimension: dimension === 'playlists' ? 'songs' : dimension,
    search: debounced,
    ...(value ? {value} : {}),
    ...(sort ? {sort} : {}),
  });
  const showCollections =
    dimension !== 'playlists' && grouped.includes(dimension) && !value && !debounced;
  useEffect(() => {
    let active = true;
    setCollections([]);
    setCollectionError(false);
    if (dimension !== 'playlists') {
      services.tracks
        .collections(dimension)
        .then(items => {
          if (active) {
            setCollections(items);
          }
        })
        .catch(() => {
          if (active) {
            setCollectionError(true);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [services, dimension, version]);
  return (
    <Page scroll={false}>
      <Row style={styles.between}>
        <Text kind="heading">{t('library')}</Text>
        <IconButton
          name="settings"
          label={t('settings')}
          onPress={() => navigation.navigate('Settings')}
        />
      </Row>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder={t('searchHint')}
        label={t('search')}
      />
      {!!search && <Button secondary label={t('clearSearch')} onPress={() => setSearch('')} />}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {dimensions.map(item => (
            <Button
              key={item}
              secondary={dimension !== item}
              label={t(item)}
              onPress={() => {
                setDimension(item);
                setValue(undefined);
              }}
            />
          ))}
        </ScrollView>
      </View>
      {dimension === 'playlists' ? (
        <PlaylistsScreen />
      ) : (
        <>
          <Row>
            {(['title', 'artist', 'recent'] as const).map(item => (
              <Button
                key={item}
                secondary={sort !== item}
                label={t(`${item}Sort`)}
                onPress={() => setSort(item)}
              />
            ))}
          </Row>
          {value && <Button secondary label={t('back')} onPress={() => setValue(undefined)} />}
          {tracks.error || collectionError ? (
            <EmptyState
              title={t('errorTitle')}
              body={t('errorBody')}
              action={<Button label={t('retry')} onPress={() => refreshLibrary(services)} />}
            />
          ) : tracks.loading ? (
            <Loading label={t('loading')} />
          ) : showCollections ? (
            <FlatList
              data={collections}
              keyExtractor={item => item.id}
              style={styles.list}
              renderItem={({item}) => (
                <View style={styles.collection}>
                  <Button
                    secondary
                    label={`${t(item.title, {defaultValue: item.title})} · ${item.count}`}
                    onPress={() => setValue(item.id)}
                  />
                </View>
              )}
              ListEmptyComponent={
                <EmptyState
                  title={t('emptyTitle')}
                  body={t('emptyBody')}
                  action={<ImportButton />}
                />
              }
            />
          ) : (
            <FlatList
              data={tracks.items}
              keyExtractor={track => track.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={7}
              onEndReached={() => {
                void tracks.loadMore();
              }}
              onEndReachedThreshold={0.5}
              renderItem={({item}) => (
                <TrackRow
                  track={item}
                  onPress={() => {
                    services.state.setState({selectedTrackId: item.id});
                    navigation.navigate('Details', {trackId: item.id});
                  }}
                  onFavorite={() => {
                    void services.tracks
                      .setFavorite(item.id, !item.favorite)
                      .then(() => refreshLibrary(services));
                  }}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  title={t(debounced ? 'noResults' : 'emptyTitle')}
                  body={t(debounced ? 'noResultsBody' : 'emptyBody')}
                  action={!debounced ? <ImportButton /> : undefined}
                />
              }
            />
          )}
        </>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  between: {justifyContent: 'space-between'},
  chips: {gap: tokens.spacing.sm, paddingBottom: tokens.spacing.xs},
  list: {flex: 1},
  collection: {paddingVertical: tokens.spacing.sm},
});
