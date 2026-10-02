import React from 'react';
import {FlatList, Modal} from 'react-native';
import {act, fireEvent, render, waitFor, within} from '@testing-library/react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {PlaylistsScreen} from './index';
import {
  createAppState,
  refreshLibrary,
  ServicesProvider,
  type Services,
} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';
import {SqlitePlaylistRepository} from '../../infrastructure/database/playlistRepository';

jest.mock('@react-navigation/native', () => ({useNavigation: () => ({navigate: jest.fn()})}));

it('creates, renames, removes membership and confirms deletion without deleting songs', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const playlists = new SqlitePlaylistRepository(database);
  const track = fixtureTrack(1);
  await tracks.save(track, {type: 'fixture', originalFilename: 'fixture'});
  const services = {
    tracks,
    playlists,
    state: createAppState(defaultSettings),
    createId: async () => 'playlist-1',
  } as unknown as Services;
  const screen = render(
    <SafeAreaInsetsContext.Provider value={{top: 0, bottom: 0, left: 0, right: 0}}>
      <ServicesProvider services={services}>
        <ThemeProvider settings={defaultSettings}>
          <PlaylistsScreen />
        </ThemeProvider>
      </ServicesProvider>
    </SafeAreaInsetsContext.Provider>,
  );
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  fireEvent.press(screen.getByRole('button', {name: 'New playlist'}));
  fireEvent.changeText(screen.getByLabelText('Playlist name'), 'Road');
  fireEvent.press(screen.getByRole('button', {name: 'Save'}));
  await waitFor(() => expect(screen.getByRole('button', {name: 'Road · 0'})).toBeOnTheScreen());
  expect((await playlists.list())[0]?.name).toBe('Road');
  await act(async () => {
    await playlists.addTrack('playlist-1', track.id);
    refreshLibrary(services);
  });
  fireEvent.press(await screen.findByRole('button', {name: 'Road · 1'}));
  await screen.findByRole('button', {name: `Remove from playlist: ${track.title}`});
  fireEvent.press(screen.getByRole('button', {name: 'Rename'}));
  fireEvent.changeText(screen.getByLabelText('Playlist name'), 'Favorites');
  fireEvent.press(screen.getByRole('button', {name: 'Save'}));
  await screen.findByRole('header', {name: 'Favorites'});
  expect((await playlists.list())[0]?.name).toBe('Favorites');
  await waitFor(() =>
    expect(
      screen.getByRole('button', {name: `Remove from playlist: ${track.title}`}),
    ).toBeEnabled(),
  );
  fireEvent.press(screen.getByRole('button', {name: `Remove from playlist: ${track.title}`}));
  await screen.findByText('A new home for your songs');
  expect(await playlists.tracks('playlist-1')).toEqual([]);
  await waitFor(() => expect(screen.getByRole('button', {name: 'Delete'})).toBeEnabled());
  fireEvent.press(screen.getByRole('button', {name: 'Delete'}));
  await screen.findByRole('header', {name: 'Delete this playlist?'});
  const dialog = screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible)!;
  await waitFor(() => expect(within(dialog).getByRole('button', {name: 'Delete'})).toBeEnabled());
  fireEvent.press(within(dialog).getByRole('button', {name: 'Delete'}));
  await waitFor(() => expect(screen.queryByRole('header', {name: 'Favorites'})).toBeNull());
  expect(await playlists.list()).toEqual([]);
  expect((await tracks.get(track.id))?.id).toBe(track.id);
  screen.unmount();
  database.close();
});

it('coalesces repeated paging events and discards pages after switching playlists', async () => {
  await initializeI18n('en');
  let resolvePage: (page: ReturnType<typeof fixtureTrack>[]) => void = () => {};
  const firstPage = Array.from({length: 60}, (_, index) => fixtureTrack(index + 1));
  const otherTrack = fixtureTrack(777);
  const playlists = {
    list: async () => [
      {id: 'a', name: 'A', count: 61},
      {id: 'b', name: 'B', count: 1},
    ],
    tracks: jest.fn((id: string, offset = 0) => {
      if (id === 'b') {
        return Promise.resolve([otherTrack]);
      }
      if (offset === 0) {
        return Promise.resolve(firstPage);
      }
      return new Promise<ReturnType<typeof fixtureTrack>[]>(resolve => {
        resolvePage = resolve;
      });
    }),
  };
  const services = {state: createAppState(defaultSettings), playlists} as unknown as Services;
  const screen = render(
    <SafeAreaInsetsContext.Provider value={{top: 0, bottom: 0, left: 0, right: 0}}>
      <ServicesProvider services={services}>
        <PlaylistsScreen />
      </ServicesProvider>
    </SafeAreaInsetsContext.Provider>,
  );
  fireEvent.press(await screen.findByRole('button', {name: 'A · 61'}));
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(60));
  fireEvent(screen.UNSAFE_getByType(FlatList), 'endReached');
  fireEvent(screen.UNSAFE_getByType(FlatList), 'endReached');
  expect(playlists.tracks).toHaveBeenCalledTimes(2);
  expect(playlists.tracks).toHaveBeenLastCalledWith('a', 60);
  fireEvent.press(screen.getByRole('button', {name: 'Back'}));
  fireEvent.press(await screen.findByRole('button', {name: 'B · 1'}));
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toEqual([otherTrack]));
  await act(async () => {
    resolvePage([fixtureTrack(61)]);
  });
  expect(screen.UNSAFE_getByType(FlatList).props.data).toEqual([otherTrack]);
});
