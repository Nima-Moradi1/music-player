# Performance evidence

Phase 1 measurements, 2026-09-29. This is a desktop baseline, not a reference-device certification.

`pnpm test` includes `app/src/testing/libraryBenchmark.test.ts`: real in-memory SQLite, 10,000 tracks, 2,000 albums, 1,500 artists and bounded 60-row pages. Development entries contain metadata only, not audio.

| Run                                       | Seed     | First page | Artist search |
| ----------------------------------------- | -------- | ---------- | ------------- |
| Desktop, before native compile contention | 2,100 ms | 3 ms       | 43 ms         |
| Desktop, concurrent C++/Metro work        | 3,823 ms | 2 ms       | 110 ms        |
| Desktop, final idle verification          | 2,366 ms | 3 ms       | 35 ms         |

The busy run exceeds the 100 ms search target. Timings are reported rather than used as flaky CI assertions. Record Android/iOS device model, OS, build mode, cold/warm startup, memory and p50/p95 query times before closing the phase. Native artwork decode/cache budgets, battery, frame pacing and 50k stress remain later gates.

Development Settings also exposes **Measure library queries**: 20 sequential 60-row page/search pairs through the actual repository and native adapter, with total track count and p50/p95 milliseconds. Its 1ms clock includes the JavaScript/native boundary and mapping. Seed first; record device/build conditions alongside the displayed JSON. It runs entirely on the device and sends no metrics to a server.

Android emulator: API 36.0, x86_64, 1080 × 2400, debug/Hermes/Metro, 10,000 persisted tracks, 20 samples, warm queries; no artwork/audio decoding. Screenshots were inspected on 2026-09-29.

| Query implementation       | Page p50 | Page p95 | Search p50 | Search p95 |
| -------------------------- | -------- | -------- | ---------- | ---------- |
| Correlated metadata lookup | 3 ms     | 10 ms    | 93 ms      | 153 ms     |
| Matching-ID union          | 3 ms     | 5 ms     | 38 ms      | 48 ms      |

The optimized query resolves matching track IDs once per searchable dimension. Real SQLite tests cover title, artist, album, genre, filename/source, language, literal wildcard escaping, playlist rename and membership removal. This emulator run meets the query target; reference-device production startup, memory and frame budgets are still unverified.
