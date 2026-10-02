import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {HomeScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({navigate: mockNavigate})}));

it('makes a failed Home count retryable and recovers without losing stored songs', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const track = fixtureTrack(1);
  await tracks.save(track, {type: 'fixture', originalFilename: 'fixture'});
  jest.spyOn(tracks, 'count').mockRejectedValueOnce(new Error('database unavailable'));
  const services = {tracks, state: createAppState(defaultSettings)} as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <HomeScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  await waitFor(() => expect(screen.getByRole('button', {name: 'Try again'})).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('button', {name: 'Try again'}));
  await waitFor(() => expect(screen.getByText('1 song')).toBeOnTheScreen());
  expect(screen.getByText(track.title)).toBeOnTheScreen();
  screen.unmount();
  database.close();
});
