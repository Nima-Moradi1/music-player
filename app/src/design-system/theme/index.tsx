import React, {createContext, useContext, useEffect, useState} from 'react';
import {AccessibilityInfo, useColorScheme} from 'react-native';
import {palettes, type Palette} from '../tokens';
import type {Settings} from '../../domain/settings';
type Theme = {
  colors: Palette;
  dark: boolean;
  rtl: boolean;
  reduceMotion: boolean;
  solid: boolean;
};
const ThemeContext = createContext<Theme>({
  colors: palettes.dark,
  dark: true,
  rtl: false,
  reduceMotion: false,
  solid: false,
});
export function ThemeProvider({settings, children}: React.PropsWithChildren<{settings: Settings}>) {
  const scheme = useColorScheme();
  const [motion, setMotion] = useState(false);
  const [transparency, setTransparency] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (alive) {
        setMotion(value);
      }
    });
    AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
      if (alive) {
        setTransparency(value);
      }
    });
    const m = AccessibilityInfo.addEventListener('reduceMotionChanged', setMotion);
    const t = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setTransparency);
    return () => {
      alive = false;
      m.remove();
      t.remove();
    };
  }, []);
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && scheme !== 'light');
  return (
    <ThemeContext.Provider
      value={{
        colors: palettes[dark ? 'dark' : 'light'],
        dark,
        rtl: settings.locale === 'fa',
        reduceMotion: motion || settings.reduceMotion,
        solid: transparency || settings.reduceTransparency || settings.highContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
