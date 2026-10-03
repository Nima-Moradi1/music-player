import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {DiscoveryScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';

const mockNavigate = jest.fn();
const mockFindRelatedRecordings = jest.fn().mockResolvedValue([]);
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({navigate: mockNavigate})}));
jest.mock('../../infrastructure/recommendations/musicBrainz', () => ({
  findRelatedRecordings: (...args: unknown[]) => mockFindRelatedRecordings(...args),
}));

it('shows local related music with its reason and opens the stored track', async () => {
  await initializeI18n('en');
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const anchor = {...fixtureTrack(1), artist: 'Together', managedPath: 'file:///one.mp3'};
  const related = {...fixtureTrack(2), artist: 'Together', managedPath: 'file:///two.mp3'};
  await tracks.save(anchor, {type: 'manual_import', originalFilename: 'one.mp3'});
  await tracks.save(related, {type: 'manual_import', originalFilename: 'two.mp3'});
  const state = createAppState(defaultSettings);
  state.setState({selectedTrackId: anchor.id});
  const services = {tracks, state} as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <DiscoveryScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  await waitFor(() => expect(screen.getByText('Same artist')).toBeOnTheScreen());
  expect(mockFindRelatedRecordings).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', {name: 'Find related recordings'}));
  await waitFor(() => expect(mockFindRelatedRecordings).toHaveBeenCalledTimes(1));
  fireEvent.press(screen.getByRole('button', {name: `${related.title}, ${related.artist}`}));
  expect(mockNavigate).toHaveBeenCalledWith('Details', {trackId: related.id});
  screen.unmount();
  database.close();
});

it('finds matching playable songs beyond the first title page', async () => {
  const database = nodeTestDatabase();
  await migrate(database);
  const tracks = new SqliteTrackRepository(database);
  const anchor = {...fixtureTrack(1), artist: 'Target', managedPath: 'file:///anchor.mp3'};
  const related = {...fixtureTrack(2), artist: 'Target', managedPath: 'file:///related.mp3'};
  await tracks.save(anchor, {type: 'manual_import', originalFilename: 'anchor.mp3'});
  for (let index = 10; index < 215; index++) {
    const unrelated = {...fixtureTrack(index), genre: 'Other', album: 'Other'};
    await tracks.save(unrelated, {type: 'fixture', originalFilename: `fixture-${index}`});
  }
  await tracks.save(related, {type: 'manual_import', originalFilename: 'related.mp3'});
  expect((await tracks.relatedCandidates(anchor)).map(track => track.id)).toContain(related.id);
  database.close();
});
