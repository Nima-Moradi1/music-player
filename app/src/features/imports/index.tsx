import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Button, Surface, Text, Toast, useHaptics} from '../../design-system';
import {refreshLibrary, useServices} from '../../app/providers/Services';
import {AppError} from '../../shared/errors';

export function ImportButton() {
  const services = useServices();
  const {t} = useTranslation();
  const haptic = useHaptics();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'status' | 'error'>('status');
  const [progress, setProgress] = useState({current: 0, total: 0});
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);
  async function importFiles() {
    if (active.current) {
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('');
    setProgress({current: 0, total: 0});
    try {
      const files = await services.selectFiles();
      let added = 0;
      let duplicates = 0;
      let failed = 0;
      let lastError = '';
      for (const [index, file] of files.entries()) {
        if (controller.signal.aborted) {
          break;
        }
        if (mounted.current) {
          setProgress({current: index + 1, total: files.length});
        }
        try {
          const result = await services.importer.import(
            file.uri,
            {type: 'manual_import', originalFilename: file.name},
            controller.signal,
          );
          if (result.duplicate) {
            duplicates++;
          } else {
            added++;
          }
          refreshLibrary(services);
        } catch (error) {
          if (controller.signal.aborted) {
            break;
          }
          failed++;
          const code = error instanceof AppError ? error.code : 'UNKNOWN';
          lastError = t(
            code === 'IMPORT_UNSUPPORTED_FORMAT'
              ? 'unsupported'
              : code === 'IMPORT_NO_SPACE'
                ? 'importLimit'
                : 'importFailed',
          );
        }
      }
      if (mounted.current) {
        const summary =
          added || duplicates || failed ? t('importSummary', {added, duplicates, failed}) : '';
        setTone(failed ? 'error' : 'status');
        setMessage(
          controller.signal.aborted
            ? `${t('cancelled')}${summary ? ` · ${summary}` : ''}`
            : `${summary}${lastError ? `\n${lastError}` : ''}`,
        );
        if (failed) {
          haptic('error');
        } else if (added) {
          haptic('success');
        }
      }
    } catch {
      if (mounted.current) {
        setTone('error');
        setMessage(t('importFailed'));
        haptic('error');
      }
    } finally {
      active.current = null;
      if (mounted.current) {
        setBusy(false);
      }
    }
  }
  return (
    <Surface>
      <Text kind="title">{t('importTitle')}</Text>
      <Text muted>{t('importBody')}</Text>
      <Button
        label={t(busy ? 'importing' : 'addMusic')}
        icon="plus"
        onPress={() => {
          void importFiles();
        }}
        disabled={busy}
      />
      {busy && (
        <>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityState={{busy: true}}
            accessibilityLabel={t(progress.total ? 'importProgress' : 'importing', progress)}
            accessibilityValue={
              progress.total ? {min: 0, max: progress.total, now: progress.current - 1} : undefined
            }
          >
            <Text accessibilityLiveRegion="polite">
              {t(progress.total ? 'importProgress' : 'importing', progress)}
            </Text>
          </View>
          <Button label={t('cancel')} secondary onPress={() => active.current?.abort()} />
        </>
      )}
      <Toast
        message={message}
        tone={tone}
        dismissLabel={t('dismiss')}
        onDismiss={() => setMessage('')}
      />
    </Surface>
  );
}
