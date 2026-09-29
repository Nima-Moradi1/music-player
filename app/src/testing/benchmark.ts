import type {TrackRepository} from '../domain/track';

export async function benchmarkLibrary(repository: TrackRepository, samples = 20) {
  const page: number[] = [];
  const search: number[] = [];
  for (let sample = 0; sample < samples; sample++) {
    let start = Date.now();
    await repository.list({limit: 60});
    page.push(Date.now() - start);
    start = Date.now();
    await repository.list({search: 'demo artist 1499', limit: 60});
    search.push(Date.now() - start);
  }
  function percentiles(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p50Ms: Number((sorted[Math.ceil(sorted.length * 0.5) - 1] ?? 0).toFixed(2)),
      p95Ms: Number((sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0).toFixed(2)),
    };
  }
  return {
    tracks: await repository.count(),
    samples,
    page: percentiles(page),
    search: percentiles(search),
  };
}
