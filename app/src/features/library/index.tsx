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
import {
  refreshLibrary,
  useLibraryVersion,
  useServices,
  runLibraryCommand,
} from '../../app/providers/Services';
import {useTracks} from '../../app/providers/useTracks';
import type {BrowseDimension, Collection, Language, LibraryQuery} from '../../domain/track';
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
  const [language, setLanguage] = useState<Language | undefined>();
  const [collectionLoading, setCollectionLoading] = useState(false);
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
    ...(language ? {language} : {}),
  });
  const showCollections =
    dimension !== 'playlists' && grouped.includes(dimension) && !value && !debounced && !language;
  useEffect(() => {
    let active = true;
    setCollections([]);
    setCollectionError(false);
    setCollectionLoading(showCollections);
    if (showCollections) {
      services.tracks
        .collections(dimension)
        .then(items => {
          if (active) {
            setCollections(items);
            setCollectionLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setCollectionError(true);
            setCollectionLoading(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [services, dimension, version, showCollections]);
  const header = (
    <View style={styles.header}>
      <Row style={styles.between}>
        <Text kind="heading">{t('library')}</Text>
        <IconButton
          name="settings"
          label={t('settings')}
          onPress={() => navigation.navigate('Settings')}
        />
      </Row>
      {dimension !== 'playlists' && (
        <>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchHint')}
            label={t('search')}
          />
          {!!search && <Button secondary label={t('clearSearch')} onPress={() => setSearch('')} />}
        </>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {dimensions.map(item => (
          <Button
            key={item}
            selected={dimension === item}
            secondary={dimension !== item}
            label={t(item)}
            onPress={() => {
              setDimension(item);
              setValue(undefined);
            }}
          />
        ))}
      </ScrollView>
      {dimension !== 'playlists' && (
        <>
          {!showCollections && !['recent', 'played', 'mostPlayed'].includes(dimension) && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              accessibilityLabel={t('sort')}
            >
              {(['title', 'artist', 'recent'] as const).map(item => (
                <Button
                  key={item}
                  selected={sort === item}
                  secondary={sort !== item}
                  label={t(`${item}Sort`)}
                  onPress={() => setSort(item)}
                />
              ))}
            </ScrollView>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            accessibilityLabel={t('languageFilter')}
          >
            {([undefined, 'fa', 'en', 'ar', 'es', 'de', 'it', 'other'] as const).map(item => (
              <Button
                key={item ?? 'all'}
                selected={language === item}
                secondary={language !== item}
                label={t(item ?? 'all')}
                onPress={() => setLanguage(item)}
              />
            ))}
          </ScrollView>
          {value && <Button secondary label={t('back')} onPress={() => setValue(undefined)} />}
        </>
      )}
    </View>
  );
  const error = showCollections ? collectionError : tracks.error;
  const loading = showCollections ? collectionLoading : tracks.loading;
  const filtered = Boolean(debounced || value || language || dimension === 'favorites');
  const unavailable =
    dimension === 'telegram'
      ? 'telegramUnavailable'
      : dimension === 'played' || dimension === 'mostPlayed'
        ? 'historyUnavailable'
        : undefined;
  const empty = error ? (
    <EmptyState
      title={t('errorTitle')}
      body={t('errorBody')}
      action={<Button label={t('retry')} onPress={() => refreshLibrary(services)} />}
    />
  ) : loading ? (
    <Loading label={t('loading')} />
  ) : (
    <EmptyState
      title={t(unavailable ? dimension : filtered ? 'noResults' : 'emptyTitle')}
      body={t(unavailable ?? (filtered ? 'noResultsBody' : 'emptyBody'))}
      action={!filtered && !unavailable ? <ImportButton /> : undefined}
    />
  );
  return (
    <Page scroll={false}>
      {dimension === 'playlists' ? (
        <PlaylistsScreen header={header} />
      ) : showCollections ? (
        <FlatList
          data={error || loading ? [] : collections}
          keyExtractor={item => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          renderItem={({item}) => (
            <View style={styles.collection}>
              <Button
                secondary
                label={`${
                  dimension === 'sources' || dimension === 'languages'
                    ? t(item.id === 'fixture' ? 'fixtureSource' : item.id, {
                        defaultValue: item.title,
                      })
                    : item.title || t(dimension === 'artists' ? 'unknownArtist' : 'unknownAlbum')
                } · ${item.count}`}
                onPress={() => setValue(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={empty}
        />
      ) : (
        <FlatList
          data={error || loading ? [] : tracks.items}
          keyExtractor={track => track.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
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
                void runLibraryCommand(services, () =>
                  services.tracks.setFavorite(item.id, !item.favorite),
                );
              }}
            />
          )}
          ListEmptyComponent={empty}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  between: {justifyContent: 'space-between', flexWrap: 'wrap'},
  header: {gap: tokens.spacing.lg, paddingBottom: tokens.spacing.lg},
  chips: {gap: tokens.spacing.sm, paddingBottom: tokens.spacing.xs},
  list: {flex: 1},
  collection: {paddingVertical: tokens.spacing.sm},
});
