import React from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {TrackDetailsScreen} from './index';
import type {RootStackParamList} from '../../app/navigation/types';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';
import {SqlitePlaylistRepository} from '../../infrastructure/database/playlistRepository';

function details(services: Services, trackId: string) {
  const props = {route: {params: {trackId}}} as NativeStackScreenProps<
    RootStackParamList,
    'Details'
  >;
  return render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <TrackDetailsScreen {...props} />
      </ThemeProvider>
    </ServicesProvider>,
  );
}

it('persists corrections on only the selected track and confirms durable playlist membership', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const playlists = new SqlitePlaylistRepository(database);
  const selected = fixtureTrack(1);
  const other = fixtureTrack(2);
  await tracks.save(selected, {type: 'fixture', originalFilename: 'selected'});
  await tracks.save(other, {type: 'fixture', originalFilename: 'other'});
  await playlists.create('quiet', 'Quiet collection');
  const services = {
    tracks,
    playlists,
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const screen = details(services, selected.id);
  await waitFor(() => expect(screen.getByText(selected.title)).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('button', {name: 'Persian'}));
  await waitFor(() => expect(screen.getByRole('button', {name: 'Persian'})).toBeSelected());
  expect((await tracks.get(selected.id))?.language).toBe('fa');
  expect((await tracks.get(other.id))?.language).toBe('ar');
  fireEvent.press(screen.getByRole('button', {name: 'Add to favorites'}));
  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'Remove from favorites'})).toBeOnTheScreen(),
  );
  expect((await tracks.get(selected.id))?.favorite).toBe(true);
  fireEvent.press(screen.getByRole('button', {name: 'Quiet collection'}));
  await waitFor(() => expect(screen.getByText('Added to Quiet collection')).toBeOnTheScreen());
  expect((await playlists.tracks('quiet')).map(track => track.id)).toEqual([selected.id]);
  expect(
    screen.getByText('Playback arrives in Phase 2. Your local library is ready to organize.'),
  ).toBeOnTheScreen();
  screen.unmount();
  database.close();
});

it('resolves a missing song to an unavailable state instead of loading forever', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const services = {
    tracks: new SqliteTrackRepository(database),
    playlists: new SqlitePlaylistRepository(database),
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const screen = details(services, fixtureTrack(99).id);
  await waitFor(() =>
    expect(screen.getByText('This song is no longer in your library.')).toBeOnTheScreen(),
  );
  expect(screen.queryByText('Loading your library…')).toBeNull();
  screen.unmount();
  database.close();
});
