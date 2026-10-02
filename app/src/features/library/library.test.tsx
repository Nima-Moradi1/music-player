import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {LibraryScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';
import {SqlitePlaylistRepository} from '../../infrastructure/database/playlistRepository';
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({navigate: mockNavigate})}));
it('shows real stored songs, persists favorite actions, and opens the selected row details', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const track = fixtureTrack(1);
  await tracks.save(track, {type: 'fixture', originalFilename: 'fixture'});
  const services = {
    tracks,
    playlists: new SqlitePlaylistRepository(database),
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <LibraryScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  await waitFor(() => expect(screen.getByText(track.title)).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('button', {name: 'Add to favorites'}));
  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'Remove from favorites'})).toBeOnTheScreen(),
  );
  expect((await tracks.get(track.id))?.favorite).toBe(true);
  fireEvent.press(screen.getByRole('button', {name: `${track.title}, ${track.artist}`}));
  expect(mockNavigate).toHaveBeenCalledWith('Details', {trackId: track.id});
  fireEvent.press(screen.getByRole('button', {name: 'Favorites'}));
  await waitFor(() => expect(screen.getByText(track.title)).toBeOnTheScreen());
  screen.unmount();
  database.close();
});

it('combines normalized search, language filters, sorting, and grouped source browsing', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const first = {
    ...fixtureTrack(1),
    title: 'Audio One',
    normalizedTitle: 'audio one',
    artist: 'Quiet',
  };
  const second = {
    ...fixtureTrack(2),
    title: 'Audio Two',
    normalizedTitle: 'audio two',
    artist: 'Sound',
  };
  await tracks.save(first, {type: 'manual_import', originalFilename: 'one.mp3'});
  await tracks.save(second, {type: 'local', originalFilename: 'two.mp3'});
  const services = {
    tracks,
    playlists: new SqlitePlaylistRepository(database),
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <LibraryScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  await waitFor(() => expect(screen.getByText(first.title)).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('button', {name: 'Newest'}));
  await waitFor(() =>
    expect(screen.getAllByText(/Audio (One|Two)/)[0]).toHaveTextContent('Audio Two'),
  );
  expect(screen.getByRole('button', {name: 'Newest'})).toBeSelected();
  fireEvent.press(screen.getByRole('button', {name: 'English'}));
  await waitFor(() => expect(screen.queryByText(second.title)).toBeNull());
  expect(screen.getByText(first.title)).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', {name: 'All'}));
  await waitFor(() => expect(screen.getByText(second.title)).toBeOnTheScreen());
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Search your library'), '  AuDIO oNE  ');
  });
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
  });
  await waitFor(() => expect(screen.queryByText(second.title)).toBeNull());
  expect(screen.getByText(first.title)).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', {name: 'Clear search'}));
  fireEvent.press(screen.getByRole('button', {name: 'Sources'}));
  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'File import · 1'})).toBeOnTheScreen(),
  );
  fireEvent.press(screen.getByRole('button', {name: 'File import · 1'}));
  await waitFor(() => expect(screen.getByText(first.title)).toBeOnTheScreen());
  expect(screen.queryByText(second.title)).toBeNull();
  fireEvent.press(screen.getByRole('button', {name: 'Back'}));
  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'Device files · 1'})).toBeOnTheScreen(),
  );
  screen.unmount();
  database.close();
});

it('explains unavailable Telegram and listening history without offering a misleading import action', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const services = {
    tracks: new SqliteTrackRepository(database),
    playlists: new SqlitePlaylistRepository(database),
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <LibraryScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Telegram'}));
  await waitFor(() =>
    expect(
      screen.getByText('Telegram sources arrive after native playback passes its gate.'),
    ).toBeOnTheScreen(),
  );
  expect(screen.queryByRole('button', {name: 'Add music'})).toBeNull();
  fireEvent.press(screen.getByRole('button', {name: 'Recently played'}));
  await waitFor(() =>
    expect(
      screen.getByText('Listening history will appear after native playback is available.'),
    ).toBeOnTheScreen(),
  );
  screen.unmount();
  database.close();
});
