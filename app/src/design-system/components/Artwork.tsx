import React from 'react';
import {Image, View} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {tokens} from '../tokens';
const artworkColors = ['#567464', '#B49B74', '#718595', '#8F727A', '#787A53'] as const;
export function Artwork({
  seed,
  uri,
  large = false,
}: {
  seed: string;
  uri?: string | null;
  large?: boolean;
}) {
  const size = large ? tokens.size.heroArtwork : tokens.size.artwork;
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % artworkColors.length;
  const color = artworkColors[index] ?? tokens.color.forest;
  if (uri) {
    return (
      <Image
        source={{uri}}
        resizeMode="cover"
        style={{width: size, height: size, borderRadius: tokens.radius.small}}
        accessible={false}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.radius.small,
        overflow: 'hidden',
      }}
      accessible={false}
    >
      <Svg width={size} height={size} viewBox="0 0 180 180">
        <Rect width="180" height="180" fill={color} />
        <Circle cx="130" cy="42" r="62" fill={tokens.color.paper} opacity="0.18" />
        <Path d="M-20 160Q80 15 210 155L210 210H-20Z" fill={tokens.color.ink} opacity="0.35" />
        <Path
          d="M-20 175Q90 60 210 175"
          fill="none"
          stroke={tokens.color.lime}
          strokeWidth="2"
          opacity="0.7"
        />
        <Circle
          cx="92"
          cy="108"
          r="18"
          fill="none"
          stroke={tokens.color.paper}
          strokeWidth="1.5"
          opacity="0.6"
        />
      </Svg>
    </View>
  );
}
