import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {Button, Text, Surface, Toggle} from '../primitives';
import {ThemeProvider} from '../theme';
import {defaultSettings} from '../../domain/settings';

it('provides visible, labeled controls and respects disabled actions', () => {
  const press = jest.fn();
  const screen = render(
    <ThemeProvider settings={defaultSettings}>
      <Button label="Add music" onPress={press} />
      <Button label="Unavailable" disabled onPress={press} />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByRole('button', {name: 'Add music'}));
  fireEvent.press(screen.getByRole('button', {name: 'Unavailable'}));
  expect(press).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', {name: 'Unavailable'})).toBeDisabled();
});
it('supports Persian text direction, large text, and a solid surface fallback', () => {
  const screen = render(
    <ThemeProvider settings={{...defaultSettings, locale: 'fa', reduceTransparency: true}}>
      <Surface>
        <Text kind="heading">کتابخانه</Text>
      </Surface>
    </ThemeProvider>,
  );
  expect(screen.getByText('کتابخانه')).toHaveStyle({textAlign: 'right', writingDirection: 'rtl'});
  expect(screen.getByText('کتابخانه').props.allowFontScaling).not.toBe(false);
});
it('exposes one named switch and lets the whole row change its checked state', () => {
  const change = jest.fn();
  const screen = render(<Toggle label="Reduce motion" value={false} onValueChange={change} />);
  const toggle = screen.getByRole('switch', {name: 'Reduce motion'});
  expect(toggle).not.toBeChecked();
  fireEvent.press(toggle);
  expect(change).toHaveBeenCalledWith(true);
  screen.rerender(<Toggle label="Reduce motion" value onValueChange={change} />);
  expect(screen.getByRole('switch', {name: 'Reduce motion'})).toBeChecked();
});
