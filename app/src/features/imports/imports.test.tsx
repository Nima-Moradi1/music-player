import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {ImportButton} from './index';
import {createAppState, ServicesProvider, type Services} from '../../app/providers/Services';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n} from '../../shared/i18n';
import {fixtureTrack} from '../../testing/fixtures';
import {AppError} from '../../shared/errors';

it('reports every result from a mixed import and refreshes only committed files', async () => {
  await initializeI18n('en');
  const state = createAppState(defaultSettings);
  const importer = {
    import: jest
      .fn()
      .mockResolvedValueOnce({track: fixtureTrack(1), duplicate: false})
      .mockRejectedValueOnce(new AppError('IMPORT_UNSUPPORTED_FORMAT'))
      .mockResolvedValueOnce({track: fixtureTrack(1), duplicate: true}),
  };
  const services = {
    state,
    importer,
    selectFiles: async () => ['one', 'two', 'three'].map(name => ({uri: name, name})),
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ImportButton />
    </ServicesProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Add music'}));
  await screen.findByText(
    '1 added · 1 already present · 1 failed\nChoose a supported MP3, FLAC or M4A/AAC file.',
  );
  expect(importer.import).toHaveBeenCalledTimes(3);
  expect(state.getState().libraryVersion).toBe(2);
  expect(screen.getByRole('button', {name: 'Add music'})).toBeEnabled();
});

it('shows progress and cancellation prevents the remaining files from starting', async () => {
  await initializeI18n('en');
  let signal: AbortSignal | undefined;
  let rejectImport: (reason: Error) => void = () => {};
  const importer = {
    import: jest.fn((_uri, _source, abortSignal: AbortSignal) => {
      signal = abortSignal;
      return new Promise((_resolve, reject) => {
        rejectImport = reject;
      });
    }),
  };
  const services = {
    state: createAppState(defaultSettings),
    importer,
    selectFiles: async () => ['one', 'two'].map(name => ({uri: name, name})),
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ImportButton />
    </ServicesProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Add music'}));
  await screen.findByRole('progressbar', {name: 'Importing 1 of 2 files'});
  fireEvent.press(screen.getByRole('button', {name: 'Cancel'}));
  expect(signal?.aborted).toBe(true);
  rejectImport(new Error('Cancelled'));
  await waitFor(() => expect(screen.getByText('Import cancelled')).toBeOnTheScreen());
  expect(importer.import).toHaveBeenCalledTimes(1);
});
