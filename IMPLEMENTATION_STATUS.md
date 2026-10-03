# Implementation Status

Statuses: `[ ]` TODO, `[~]` in progress, `[x]` verified done, `[!]` blocked, `[-]` dropped with reason.

## Phase 1 — Foundation.

- [x] P1-T01 Repository structure, contract, phase docs, ADR-001, privacy/security.
- [x] P1-T02 Public GitHub repository and isolated feature commits.
- [x] P1-T03 RN 0.87.1 New Architecture Android/iOS project.
- [~] P1-T04 Strict TypeScript, lint, formatting, unit/component CI. JavaScript and Android native build/tests passed in run 37098359433; local current-source iOS simulator Debug build passed; iOS CI and Android E2E gate remain open.
- [x] P1-T05 Domain contracts and stable errors.
- [~] P1-T06 Tokens, sheets/dialogs/toasts/skeletons, native haptics, light/dark, EN/FA, RTL, motion/transparency fallbacks; iOS 27 Home/Library/Settings audits, accessibility-medium text size and Persian settings/RTL persistence pass. Screen-reader/device matrix pending.
- [x] P1-T07 SQLite adapter, transactional migrations, repositories and settings migrations.
- [~] P1-T08 Managed files, native metadata/streaming SHA-256, atomic import/dedupe, journal/recovery and bounded embedded artwork; native failure matrix pending.
- [~] P1-T09 Onboarding, Home, Library and all browse dimensions.
- [~] P1-T10 Search, favorites, playlists CRUD, sorting/filtering.
- [~] P1-T11 Manual import, 10k fixture, diagnostics and functional mini-player controls; native import failure matrix remains open.
- [~] P1-T12 Android build/native tests passed in CI run 37098359433. Run 37099499793 imported MP3, then picker hid FLAC under `audio/*`; all-files picker plus native validation is pushed in 8a096a5, rerun pending.
- [x] P1-T13 iOS Debug build, iOS 27 simulator boot and two native UI tests pass after Pod target and scene-lifecycle fixes (2026-10-02).
- [~] P1-T14 Accessibility/device matrix, component/E2E and 10k benchmark gates; 59 JS tests and current iOS simulator launch/navigation/accessibility/Persian audits pass (3 UI tests, zero failures); Android E2E and screen-reader evidence pending.

Phase 1 is PARTIAL. Evidence and remaining acceptance items are in `docs/phases/PHASE_01_FOUNDATION.md` and `docs/qa/`. Physical-device and screen-reader gates cannot be marked complete from simulator evidence. Phase 2 implementation has begun at the user's request; its exit remains open.

## Phase 2 — Native audio

- [~] P2-T01 Media3 ExoPlayer session service, foreground permission/notification path, audio focus/noisy handling and bridge implemented; current-source Android CI build passed, device playback pending.
- [~] P2-T02 iOS AVPlayer, playback session/background mode, Now Playing, play/pause/seek remote commands, preferred speed and basic interruption/route handling implemented; current simulator Debug build and UI smoke pass, playback/device matrix pending.
- [~] P2-T03 Persisted selected track, position, manual queue, repeat mode and speed with paused restore, completion advance/wrap and 1-second poll; native queue/system next, shuffle, lifecycle stress and crash recovery remain open.
- [~] P2-T04 Details and mini-player controls now include previous/next, repeat and speed alongside seek, enqueue, native sleep timer and A–B repeat; seek slider/queue sheet/gestures and device verification remain open.
- [ ] P2-T05 Cross-platform DSP, presets, ReplayGain, artwork/Skia and visualizer.
- [ ] P2-T06 Real-device interruption matrix, codec tests and 1h soak.

## Phase 3 — Telegram

- [!] P3-T01 Own API credentials, native TDLib packaging, secure keys and auth; credentials and native integration unavailable.
- [~] P3-T02 Persisted opt-in consent, source and network policy UI with honest unavailable connection state; auth and native execution pending.
- [~] P3-T03 Bounded Main/Archive history scanner core, candidate validation, cancellation and SQLite cursors tested; TDLib adapter/new-message reconciliation/retries pending.
- [ ] P3-T04 Bounded downloads, validation, provenance/hash dedupe and atomic import.
- [ ] P3-T05 New-message sync, exclusions, pause/disconnect and local retention.
- [ ] P3-T06 Dedicated-account Android/iOS tests and current terms compliance gate.

## Phase 4 — Advanced experience

- [~] P4-T01 Local user-supplied plain/LRC lyrics, SQLite cache, active line and offset UI; embedded/provider lyrics and licensing gate pending.
- [~] P4-T02 Bounded on-device artist/genre/album recommendations with Persian locale tie preference and reasons; provider adapters pending.
- [ ] P4-T03 Only licensed downloads, native resilience and shared import pipeline.
- [ ] P4-T04 Android widget and iOS WidgetKit/App Intents.
- [ ] P4-T05 Advanced EQ/gestures/visuals and responsive accessibility/performance.

## Phase 5 — Release

- [ ] P5-T01 Recovery, storage, migrations, backup/restore and offline/security audit.
- [ ] P5-T02 License/SBOM, privacy, provider/Telegram terms and localization audit.
- [ ] P5-T03 Device performance, battery/thermal/memory, 24h playback and upgrade tests.
- [ ] P5-T04 Native/E2E/release CI, versioning, signing and smoke tests.
- [ ] P5-T05 Verified Android AAB/APK and iOS archive/TestFlight guides and artifacts.
