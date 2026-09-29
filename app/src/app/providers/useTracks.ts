import {useCallback, useEffect, useRef, useState} from 'react';
import type {LibraryQuery, Track} from '../../domain/track';
import {useLibraryVersion, useServices} from './Services';
export function useTracks(query: LibraryQuery = {}) {
  const {tracks} = useServices();
  const version = useLibraryVersion();
  const key = JSON.stringify(query);
  const [items, setItems] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const generation = useRef(0);
  const busy = useRef(false);
  const limit = query.limit ?? 60;
  useEffect(() => {
    const request = ++generation.current;
    busy.current = true;
    setLoading(true);
    setError(false);
    setItems([]);
    setHasMore(true);
    const input = JSON.parse(key) as LibraryQuery;
    tracks
      .list({...input, limit, offset: 0})
      .then(result => {
        if (request === generation.current) {
          setItems(result);
          setHasMore(result.length === limit);
        }
      })
      .catch(() => {
        if (request === generation.current) {
          setError(true);
        }
      })
      .finally(() => {
        if (request === generation.current) {
          busy.current = false;
          setLoading(false);
        }
      });
    return () => {
      generation.current = request + 1;
    };
  }, [key, tracks, version, limit]);
  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) {
      return;
    }
    const request = generation.current;
    busy.current = true;
    try {
      const result = await tracks.list({
        ...(JSON.parse(key) as LibraryQuery),
        limit,
        offset: items.length,
      });
      if (request === generation.current) {
        setItems(previous => [...previous, ...result]);
        setHasMore(result.length === limit);
      }
    } catch {
      if (request === generation.current) {
        setError(true);
      }
    } finally {
      if (request === generation.current) {
        busy.current = false;
      }
    }
  }, [tracks, key, items.length, hasMore, limit]);
  return {items, loading, error, loadMore};
}
