import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {Track} from '../../domain/track';
import {tokens} from '../tokens';
import {Text, Row, IconButton} from '../primitives';
import {Artwork} from './Artwork';
import {useTheme} from '../theme';
export function TrackRow({
  track,
  onPress,
  onFavorite,
}: {
  track: Track;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const {t} = useTranslation();
  const {colors} = useTheme();
  return (
    <Row style={[styles.row, {borderColor: colors.border}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${track.title}, ${track.artist || t('unknownArtist')}`}
        onPress={onPress}
        style={styles.content}
      >
        <Row>
          <Artwork seed={track.id} uri={track.artworkPath} />
          <View style={styles.copy}>
            <Text numberOfLines={1}>{track.title}</Text>
            <Text muted kind="caption" numberOfLines={1}>
              {track.artist || t('unknownArtist')}
            </Text>
          </View>
        </Row>
      </Pressable>
      <IconButton
        name="heart"
        label={t(track.favorite ? 'unfavorite' : 'favorite')}
        selected={track.favorite}
        onPress={onFavorite}
      />
    </Row>
  );
}
const styles = StyleSheet.create({
  row: {minHeight: tokens.size.row, borderBottomWidth: tokens.surface.border},
  content: {flex: 1, minHeight: tokens.size.touch, justifyContent: 'center'},
  copy: {flex: 1, gap: tokens.spacing.xs},
});
