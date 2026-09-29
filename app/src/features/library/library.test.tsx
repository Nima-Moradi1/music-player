import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
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
