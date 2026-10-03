import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {TelegramSettingsScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {defaultTelegramPolicy} from '../../domain/telegram/policy';
import {initializeI18n} from '../../shared/i18n';

it('discloses unavailable connection and saves explicit source and consent choices', async () => {
  await initializeI18n('en');
  const write = jest.fn();
  const services = {
    state: createAppState(defaultSettings),
    telegramPreferences: {read: () => defaultTelegramPolicy, write},
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <TelegramSettingsScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  expect(screen.getByText(/Connection is unavailable/)).toBeOnTheScreen();
  expect(screen.queryByRole('switch', {name: 'Groups'})).toBeNull();
  fireEvent.press(screen.getByRole('switch', {name: 'Private chats'}));
  fireEvent.press(
    screen.getByRole('switch', {name: 'Allow scanning of selected sources when connected'}),
  );
  expect(write).toHaveBeenLastCalledWith(
    expect.objectContaining({privateChats: false, consent: true, channels: false, groups: false}),
  );
});
