import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';
import {tokens} from '../tokens';
import {useTheme} from '../theme';
const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  library: 'M4 4v16M9 4v16M14 4v16m4-16 3 16',
  discover: 'm16 8-3 5-5 3 3-5Z',
  downloads: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  settings:
    'm12 8 4 4-4 4-4-4ZM3 12h2m14 0h2M12 3v2m0 14v2M5.6 5.6 1.4 1.4m10 10 1.4 1.4M5.6 18.4 1.4-1.4m10-10 1.4-1.4',
  music: 'M9 18V5l11-2v13M9 8l11-2M9 18c0 3-6 4-6 1s6-4 6-1Zm11-2c0 3-6 4-6 1s6-4 6-1Z',
  plus: 'M12 5v14M5 12h14',
  search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  close: 'm6 6 12 12M6 18 18 6',
  lock: 'M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0v4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  color,
  size = tokens.size.icon,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const {colors} = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'discover' && (
        <Circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={color ?? colors.text}
          strokeWidth="1.7"
        />
      )}
      <Path
        d={paths[name]}
        stroke={color ?? colors.text}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
