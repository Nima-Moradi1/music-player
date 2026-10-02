import {NativeModules} from 'react-native';
import {useTheme} from './theme';

export type HapticKind = 'selection' | 'success' | 'error';
// Native feedback is optional on devices without a supported feedback engine.
export function useHaptics() {
  const {reduceMotion} = useTheme();
  return (kind: HapticKind) => {
    if (reduceMotion) {
      return;
    }
    const module = NativeModules.Haptics as {feedback?: (kind: HapticKind) => void} | undefined;
    module?.feedback?.(kind);
  };
}
