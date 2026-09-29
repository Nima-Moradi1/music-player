import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Surface, Text} from '../../design-system';
import {refreshLibrary, useServices} from '../../app/providers/Services';
import {AppError} from '../../shared/errors';
export function ImportButton() {
  const services = useServices();
  const {t} = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
    try {
      const files = await services.selectFiles();
      let added = 0;
      let duplicates = 0;
      let failed = 0;
      for (const file of files) {
        if (controller.signal.aborted) {
          break;
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
          if (mounted.current) {
            setMessage(
              t(
                code === 'IMPORT_UNSUPPORTED_FORMAT'
                  ? 'unsupported'
                  : code === 'IMPORT_NO_SPACE'
                    ? 'importLimit'
                    : 'importFailed',
              ),
            );
          }
        }
      }
      if (mounted.current && !failed) {
        setMessage(
          controller.signal.aborted
            ? t('cancelled')
            : added
              ? `${t('importComplete')} · ${added}${duplicates ? ` · ${t('duplicate')} ${duplicates}` : ''}`
              : duplicates
                ? t('duplicate')
                : '',
        );
      }
    } catch {
      if (mounted.current) {
        setMessage(t('importFailed'));
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
      {busy && <Button label={t('cancel')} secondary onPress={() => active.current?.abort()} />}
      {!!message && <Text accessibilityLiveRegion="polite">{message}</Text>}
    </Surface>
  );
}
