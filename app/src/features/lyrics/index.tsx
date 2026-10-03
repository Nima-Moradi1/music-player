import React, {useEffect, useMemo, useState} from 'react';
import {TextInput, StyleSheet} from 'react-native';
import {useStore} from 'zustand';
import {useTranslation} from 'react-i18next';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, Loading, Page, Row, Surface, Text, tokens, useTheme} from '../../design-system';
import {useServices} from '../../app/providers/Services';
import type {RootStackParamList} from '../../app/navigation/types';
import {activeLineIndex, type LyricsDocument} from '../../domain/lyrics';
import {SqliteLyricsRepository} from '../../infrastructure/database/lyricsRepository';

export function LyricsScreen({route}: NativeStackScreenProps<RootStackParamList, 'Lyrics'>) {
  const {t} = useTranslation();
  const {colors, rtl} = useTheme();
  const services = useServices();
  const playback = useStore(services.audio.state);
  const repository = useMemo(
    () => new SqliteLyricsRepository(services.database),
    [services.database],
  );
  const [document, setDocument] = useState<LyricsDocument | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const trackId = route.params.trackId;
  useEffect(() => {
    let alive = true;
    repository
      .getLocal(trackId)
      .then(value => {
        if (alive) {
          setDocument(value);
          setDraft(value?.text ?? '');
        }
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [repository, trackId]);
  async function save(text: string, offsetMs: number) {
    setBusy(true);
    setError(false);
    try {
      const saved = await repository.saveLocal(trackId, text, offsetMs);
      setDocument(saved);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const position = playback.trackId === trackId ? playback.positionMs : 0;
  const active = document ? activeLineIndex(document.lines, position, document.offsetMs) : -1;
  const windowStart = Math.max(0, active - 2);
  const visibleLines = document?.lines.slice(windowStart, windowStart + 6) ?? [];
  return (
    <Page>
      <Text kind="heading">{t('lyrics')}</Text>
      <Text muted>{t('lyricsLocalBody')}</Text>
      {loading ? (
        <Loading label={t('loading')} />
      ) : (
        <>
          {document && !editing && (
            <Surface>
              {document.lines.length ? (
                visibleLines.map((line, index) => (
                  <Text
                    key={`${line.atMs}:${index}`}
                    kind={windowStart + index === active ? 'title' : 'body'}
                    muted={windowStart + index !== active}
                    accessibilityLiveRegion={windowStart + index === active ? 'polite' : 'none'}
                  >
                    {line.text}
                  </Text>
                ))
              ) : (
                <Text>{document.text}</Text>
              )}
            </Surface>
          )}
          {!document && !editing && (
            <Surface>
              <Text muted>{t('lyricsEmpty')}</Text>
            </Surface>
          )}
          {editing && (
            <TextInput
              accessibilityLabel={t('lyricsInput')}
              multiline
              value={draft}
              onChangeText={setDraft}
              placeholder={t('lyricsHint')}
              placeholderTextColor={colors.muted}
              style={[
                styles.editor,
                rtl ? styles.rtl : styles.ltr,
                {
                  color: colors.text,
                  backgroundColor: colors.elevated,
                },
              ]}
            />
          )}
          <Button
            label={editing ? t('save') : document ? t('editLyrics') : t('addLyrics')}
            disabled={busy || (editing && !draft.trim())}
            onPress={() => {
              if (editing) void save(draft, document?.offsetMs ?? 0);
              else setEditing(true);
            }}
          />
          {editing && (
            <Button
              label={t('cancel')}
              secondary
              onPress={() => {
                setDraft(document?.text ?? '');
                setEditing(false);
              }}
            />
          )}
          {!!document?.lines.length && !editing && (
            <Surface>
              <Text kind="title">
                {t('lyricsOffset', {seconds: (document.offsetMs / 1000).toFixed(1)})}
              </Text>
              <Row>
                <Button
                  label={t('lyricsEarlier')}
                  secondary
                  disabled={busy || document.offsetMs <= -30000}
                  onPress={() => {
                    void save(document.text, document.offsetMs - 500);
                  }}
                />
                <Button
                  label={t('lyricsLater')}
                  secondary
                  disabled={busy || document.offsetMs >= 30000}
                  onPress={() => {
                    void save(document.text, document.offsetMs + 500);
                  }}
                />
              </Row>
            </Surface>
          )}
          {error && <Text accessibilityLiveRegion="polite">{t('actionFailed')}</Text>}
        </>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  rtl: {textAlign: 'right'},
  ltr: {textAlign: 'left'},
  editor: {
    minHeight: 180,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.card,
    textAlignVertical: 'top',
  },
});
