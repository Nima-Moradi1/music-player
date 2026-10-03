import React, {useEffect, useRef, useState} from 'react';
import {Linking, Platform, StyleSheet, TextInput} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useServices, useSelectedTrackId, refreshLibrary} from '../../app/providers/Services';
import {importLicensedDownload, type LicensedOffer} from '../../domain/downloads/licensedDownload';
import {commonsProvider, searchCommonsAudio} from '../../infrastructure/downloads/commons';
import {nativeDownloadTransfer} from '../../infrastructure/downloads/nativeTransfer';
import {Button, Page, Surface, Text, tokens, useTheme} from '../../design-system';

export function DownloadsScreen() {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const services = useServices();
  const selectedId = useSelectedTrackId();
  const [query, setQuery] = useState('');
  const [offers, setOffers] = useState<LicensedOffer[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    let alive = true;
    if (selectedId)
      void services.tracks.get(selectedId).then(track => {
        if (alive && track) setQuery(track.artist || track.genre || track.title);
      });
    return () => {
      alive = false;
      request.current?.abort();
    };
  }, [selectedId, services]);
  function search() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage('');
    void searchCommonsAudio(query, controller.signal)
      .then(found => {
        if (!controller.signal.aborted) {
          setOffers(found);
          setSearched(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage(t('catalogError'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
  }
  function download(item: LicensedOffer) {
    if (Platform.OS !== 'ios' || downloading) return;
    const controller = new AbortController();
    request.current = controller;
    setDownloading(item.itemId);
    setMessage('');
    void importLicensedDownload({
      offer: item,
      provider: commonsProvider,
      transfer: nativeDownloadTransfer,
      importer: services.importer,
      maxBytes: 512 * 1024 * 1024,
      signal: controller.signal,
    })
      .then(result => {
        refreshLibrary(services);
        setMessage(t(result.duplicate ? 'duplicate' : 'importComplete'));
      })
      .catch(() =>
        setMessage(controller.signal.aborted ? t('cancelled') : t('catalogDownloadError')),
      )
      .finally(() => setDownloading(null));
  }
  return (
    <Page>
      <Text kind="heading">{t('downloads')}</Text>
      <Text muted>{t('catalogBody')}</Text>
      <TextInput
        accessibilityLabel={t('catalogSearch')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('catalogSearch')}
        placeholderTextColor={colors.muted}
        style={[styles.input, {color: colors.text, backgroundColor: colors.elevated}]}
      />
      <Button
        label={busy ? t('loading') : t('catalogSearch')}
        disabled={busy || query.trim().length < 2}
        onPress={search}
      />
      {Platform.OS !== 'ios' && <Text muted>{t('catalogIosOnly')}</Text>}
      {searched && !offers.length && <Text muted>{t('catalogEmpty')}</Text>}
      {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
      {offers.map(item => (
        <Surface key={item.itemId}>
          <Text kind="title">{item.filename.replace(/\.(mp3|flac|m4a|aac)$/i, '')}</Text>
          <Text muted>{item.author}</Text>
          <Text kind="caption" muted>
            {item.license} · {(item.sizeBytes / 1048576).toFixed(1)} MB
          </Text>
          <Button
            label={t('catalogSource')}
            secondary
            onPress={() => {
              void Linking.openURL(item.sourceUrl);
            }}
          />
          <Button
            label={t('catalogLicense')}
            secondary
            onPress={() => {
              void Linking.openURL(item.licenseUrl);
            }}
          />
          <Button
            label={downloading === item.itemId ? t('importing') : t('catalogDownload')}
            disabled={Platform.OS !== 'ios' || !!downloading}
            onPress={() => download(item)}
          />
          {downloading === item.itemId && (
            <Button label={t('cancel')} secondary onPress={() => request.current?.abort()} />
          )}
        </Surface>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  input: {padding: tokens.spacing.md, borderRadius: tokens.radius.card},
});
