import React from 'react';
import {AccessibilityInfo, Modal, NativeModules} from 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {Dialog, Sheet, Skeleton, Toast} from './Feedback';
import {Button, Text} from '../primitives';
import {ThemeProvider} from '../theme';
import {useHaptics} from '../haptics';
import {defaultSettings} from '../../domain/settings';

function Wrapper({children}: React.PropsWithChildren) {
  return (
    <SafeAreaInsetsContext.Provider value={{top: 24, bottom: 24, left: 0, right: 0}}>
      <ThemeProvider settings={{...defaultSettings, locale: 'fa', reduceMotion: true}}>
        {children}
      </ThemeProvider>
    </SafeAreaInsetsContext.Provider>
  );
}

it('labels the sheet, preserves RTL/scaling and removes motion with an accessible dismissal', () => {
  const close = jest.fn();
  const screen = render(
    <Sheet visible title="فهرست جدید" closeLabel="لغو" onClose={close}>
      <Text>نام فهرست</Text>
    </Sheet>,
    {wrapper: Wrapper},
  );
  expect(screen.getByRole('header', {name: 'فهرست جدید'})).toHaveStyle({textAlign: 'right'});
  expect(screen.getByText('نام فهرست').props.allowFontScaling).not.toBe(false);
  expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  fireEvent.press(screen.getByRole('button', {name: 'لغو'}));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(close).toHaveBeenCalledTimes(2);
});

it('prevents cancelling or repeating destructive dialog actions while the write is pending', () => {
  const close = jest.fn();
  const confirm = jest.fn();
  const screen = render(
    <Dialog
      visible
      title="Delete?"
      body="Songs stay."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onClose={close}
      onConfirm={confirm}
      busy
    />,
    {wrapper: Wrapper},
  );
  fireEvent.press(screen.getByRole('button', {name: 'Delete'}));
  fireEvent.press(screen.getByRole('button', {name: 'Cancel'}));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(confirm).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
});

it('announces a single named busy skeleton and explicit selected state', () => {
  const screen = render(
    <>
      <Skeleton label="Loading playlists" />
      <Button label="Persian" selected onPress={() => {}} />
    </>,
  );
  expect(
    screen.getByRole('progressbar', {name: 'Loading playlists'}).props.accessibilityState,
  ).toEqual({busy: true});
  expect(screen.getByRole('button', {name: 'Persian'})).toBeSelected();
});

it('keeps status available for screen-reader users and exposes manual dismissal', async () => {
  jest.useFakeTimers();
  const screenReader = jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(true);
  const dismiss = jest.fn();
  const screen = render(
    <Toast message="Playlist saved" dismissLabel="Dismiss" onDismiss={dismiss} duration={2000} />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(dismiss).not.toHaveBeenCalled();
  expect(screen.getByRole('alert', {name: 'Playlist saved'})).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', {name: 'Dismiss'}));
  expect(dismiss).toHaveBeenCalledTimes(1);
  screen.unmount();
  screenReader.mockRestore();
  jest.useRealTimers();
});

it('dispatches native feedback only when reduced motion is off', () => {
  const feedback = jest.fn();
  NativeModules.Haptics = {feedback};
  function Action() {
    const haptic = useHaptics();
    return <Button label="Save" onPress={() => haptic('success')} />;
  }
  const screen = render(
    <ThemeProvider settings={defaultSettings}>
      <Action />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Save'}));
  expect(feedback).toHaveBeenCalledWith('success');
  screen.rerender(
    <ThemeProvider settings={{...defaultSettings, reduceMotion: true}}>
      <Action />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Save'}));
  expect(feedback).toHaveBeenCalledTimes(1);
  delete NativeModules.Haptics;
});
