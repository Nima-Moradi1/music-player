# Implementation Status

Statuses: `[ ]` TODO, `[~]` in progress, `[x]` verified done, `[!]` blocked, `[-]` dropped with reason.

## Phase 1 — Foundation

- [x] P1-T01 Repository structure, contract, phase docs, ADR-001, privacy/security.
- [x] P1-T02 Public GitHub repository and isolated feature commits.
- [x] P1-T03 RN 0.87.1 New Architecture Android/iOS project.
- [~] P1-T04 Strict TypeScript, lint, formatting, unit/component CI; local Node 23 SQLite adapter repaired. CI Node 24 playlist deletion test exposed an unflushed asynchronous React update; the test is repaired locally and 43 tests pass on Node 24, awaiting a new CI run.
- [x] P1-T05 Domain contracts and stable errors.
- [~] P1-T06 Tokens, sheets/dialogs/toasts/skeletons, native haptics, light/dark, EN/FA, RTL, motion/transparency fallbacks; iOS 27 accessibility audit passes, screen-reader/device matrix pending.
- [x] P1-T07 SQLite adapter, transactional migrations, repositories and settings migrations.
- [~] P1-T08 Managed files, native metadata/streaming SHA-256, atomic import/dedupe, journal/recovery and bounded embedded artwork; native failure matrix pending.
- [~] P1-T09 Onboarding, Home, Library and all browse dimensions.
- [~] P1-T10 Search, favorites, playlists CRUD, sorting/filtering.
- [~] P1-T11 Manual import, 10k fixture, diagnostics, mini-player placeholder.
- [~] P1-T12 Earlier Android debug build/native tests/emulator boot passed; latest committed CI has a Kotlin haptics compile regression, locally patched and awaiting rebuild.
- [x] P1-T13 iOS Debug build, iOS 27 simulator boot and two native UI tests pass after Pod target and scene-lifecycle fixes (2026-10-02).
- [~] P1-T14 Accessibility/device matrix, component/E2E and 10k benchmark gates; 43 JS tests and iOS simulator navigation/accessibility audits pass, Android current-source and screen-reader evidence pending.

Phase 1 is PARTIAL. Evidence and remaining acceptance items are in `docs/phases/PHASE_01_FOUNDATION.md` and `docs/qa/`. Later phases remain gated by its exit; the first-session contract also prohibits Telegram/DSP work.

## Phase 2 — Native audio

- [ ] P2-T01 Android Media3 service, session, notification, focus/routes and typed bridge.
- [ ] P2-T02 iOS AVFoundation, Now Playing, remote commands and interruptions.
- [ ] P2-T03 Deterministic state, queue, progress, crash restore and resume.
- [ ] P2-T04 Player, gestures with visible alternatives, sleep timer and A–B repeat.
- [ ] P2-T05 Cross-platform DSP, presets, ReplayGain, artwork/Skia and visualizer.
- [ ] P2-T06 Real-device interruption matrix, codec tests and 1h soak.

## Phase 3 — Telegram

- [ ] P3-T01 Own API credentials, native TDLib packaging, secure keys and auth.
- [ ] P3-T02 Consent, auth and source/network/storage policy UI.
- [ ] P3-T03 Main/Archive incremental scan, cursors, cancellation and bounded retries.
- [ ] P3-T04 Bounded downloads, validation, provenance/hash dedupe and atomic import.
- [ ] P3-T05 New-message sync, exclusions, pause/disconnect and local retention.
- [ ] P3-T06 Dedicated-account Android/iOS tests and current terms compliance gate.

## Phase 4 — Advanced experience

- [ ] P4-T01 Embedded/cached/provider lyrics, LRC timing, offset and licensing gate.
- [ ] P4-T02 Artist/genre recommendations, locale priority and explanations.
- [ ] P4-T03 Only licensed downloads, native resilience and shared import pipeline.
- [ ] P4-T04 Android widget and iOS WidgetKit/App Intents.
- [ ] P4-T05 Advanced EQ/gestures/visuals and responsive accessibility/performance.

## Phase 5 — Release

- [ ] P5-T01 Recovery, storage, migrations, backup/restore and offline/security audit.
- [ ] P5-T02 License/SBOM, privacy, provider/Telegram terms and localization audit.
- [ ] P5-T03 Device performance, battery/thermal/memory, 24h playback and upgrade tests.
- [ ] P5-T04 Native/E2E/release CI, versioning, signing and smoke tests.
- [ ] P5-T05 Verified Android AAB/APK and iOS archive/TestFlight guides and artifacts.
