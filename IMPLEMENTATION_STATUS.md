# Implementation Status

Statuses: `[ ]` TODO, `[~]` in progress, `[x]` verified done, `[!]` blocked, `[-]` dropped with reason.

## Phase 1 — Foundation.

- [x] P1-T01 Repository structure, contract, phase docs, ADR-001, privacy/security.
- [x] P1-T02 Public GitHub repository and isolated feature commits.
- [x] P1-T03 RN 0.87.1 New Architecture Android/iOS project.
- [~] P1-T04 Strict TypeScript, lint, formatting, unit/component CI. JavaScript CI passed on commit 41ff79f; full native workflow for current audio source remains pending.
- [x] P1-T05 Domain contracts and stable errors.
- [~] P1-T06 Tokens, sheets/dialogs/toasts/skeletons, native haptics, light/dark, EN/FA, RTL, motion/transparency fallbacks; iOS 27 Home/Library/Settings audits, accessibility-medium text size and Persian settings/RTL persistence pass. Screen-reader/device matrix pending.
- [x] P1-T07 SQLite adapter, transactional migrations, repositories and settings migrations.
- [~] P1-T08 Managed files, native metadata/streaming SHA-256, atomic import/dedupe, journal/recovery and bounded embedded artwork; native failure matrix pending.
- [~] P1-T09 Onboarding, Home, Library and all browse dimensions.
- [~] P1-T10 Search, favorites, playlists CRUD, sorting/filtering.
- [~] P1-T11 Manual import, 10k fixture, diagnostics, mini-player placeholder.
- [~] P1-T12 Android debug build and native tests passed in feature CI run 37046205237. Run 37097418040 reached onboarding but the first tap was swallowed by the emulator; onboarding tap retry is implemented, awaiting E2E rerun.
- [x] P1-T13 iOS Debug build, iOS 27 simulator boot and two native UI tests pass after Pod target and scene-lifecycle fixes (2026-10-02).
- [~] P1-T14 Accessibility/device matrix, component/E2E and 10k benchmark gates; 46 JS tests and iOS simulator navigation/accessibility audits pass, Android current-source and screen-reader evidence pending.

Phase 1 is PARTIAL. Evidence and remaining acceptance items are in `docs/phases/PHASE_01_FOUNDATION.md` and `docs/qa/`. Physical-device and screen-reader gates cannot be marked complete from simulator evidence. Phase 2 implementation has begun at the user's request; its exit remains open.

## Phase 2 — Native audio

- [~] P2-T01 Media3 ExoPlayer session service, foreground permission/notification path, audio focus/noisy handling and bridge implemented; current-source Android build and device playback pending.
- [~] P2-T02 iOS AVPlayer, playback session/background mode, Now Playing, play/pause/seek remote commands and basic interruption/route handling implemented; simulator Debug build passes, playback/device matrix pending.
- [~] P2-T03 Persisted selected track, position and manual queue with paused restore, completion advance and 1-second progress poll; two controller tests pass. Native queue/system next, lifecycle stress and crash recovery remain open.
- [~] P2-T04 Details and mini-player play/pause, 10-second seek, manual enqueue and next controls plus native 30-minute sleep timer and A–B repeat implemented; gestures, full player UX and native/device verification remain open.
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
