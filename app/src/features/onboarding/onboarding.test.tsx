import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {OnboardingScreen} from './index';
import {ServicesProvider, createAppState, type Services} from '../../app/providers/Services';
import {ThemeProvider} from '../../design-system';
import {defaultSettings} from '../../domain/settings';
import {initializeI18n, en, fa} from '../../shared/i18n';
it('provides matching EN/FA strings and persists explicit onboarding completion', async () => {
  expect(Object.keys(fa).sort()).toEqual(Object.keys(en).sort());
  await initializeI18n('en');
  const write = jest.fn();
  const services = {
    state: createAppState(defaultSettings),
    preferences: {read: () => defaultSettings, write},
  } as unknown as Services;
  const screen = render(
    <ServicesProvider services={services}>
      <ThemeProvider settings={defaultSettings}>
        <OnboardingScreen />
      </ThemeProvider>
    </ServicesProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Make it yours'}));
  await waitFor(() =>
    expect(write).toHaveBeenCalledWith(expect.objectContaining({onboarded: true})),
  );
  expect(services.state.getState().settings.onboarded).toBe(true);
});
