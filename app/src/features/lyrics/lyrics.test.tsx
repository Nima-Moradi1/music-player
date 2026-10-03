import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {createStore} from 'zustand/vanilla';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {LyricsScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import type {RootStackParamList} from '../../app/navigation/types';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';

it('saves local LRC and displays the active line from playback time', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const track = fixtureTrack(1);
  await new SqliteTrackRepository(database).save(track, {
    type: 'fixture',
    originalFilename: 'fixture',
  });
  const audio = {state: createStore(() => ({trackId: track.id, positionMs: 3000}))};
  const services = {
    database,
    audio,
    tracks: new SqliteTrackRepository(database),
    state: createAppState(defaultSettings),
  } as unknown as Services;
  const props = {route: {params: {trackId: track.id}}} as NativeStackScreenProps<
    RootStackParamList,
    'Lyrics'
  >;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <LyricsScreen {...props} />
      </ThemeProvider>
    </ServicesProvider>,
  );
  await waitFor(() => expect(screen.getByText('No lyrics saved for this song.')).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('button', {name: 'Add lyrics'}));
  fireEvent.changeText(screen.getByLabelText('Lyrics text'), '[00:01.00]First\n[00:03.00]Second');
  fireEvent.press(screen.getByRole('button', {name: 'Save'}));
  await waitFor(() => expect(screen.getByText('Second')).toBeOnTheScreen());
  expect(screen.getByText('Second')).toHaveProp('accessibilityLiveRegion', 'polite');
  screen.unmount();
  database.close();
});
