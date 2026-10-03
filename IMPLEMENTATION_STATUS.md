# Implementation Status

Statuses: `[ ]` TODO, `[~]` in progress, `[x]` verified done, `[!]` blocked, `[-]` dropped with reason.

## Phase 1 — Foundation.

- [x] P1-T01 Repository structure, contract, phase docs, ADR-001, privacy/security.
- [x] P1-T02 Public GitHub repository and isolated feature commits.
- [x] P1-T03 RN 0.87.1 New Architecture Android/iOS project.
- [~] P1-T04 Strict TypeScript, lint, formatting, unit/component CI. Earlier JavaScript and Android native build/tests passed; run 37100739974 completed with Android E2E and iOS simulator-smoke failures whose logs need authenticated access.
- [x] P1-T05 Domain contracts and stable errors.
- [~] P1-T06 Tokens, sheets/dialogs/toasts/skeletons, native haptics, light/dark, EN/FA, RTL, motion/transparency fallbacks; iOS 27 Home/Library/Settings audits, accessibility-medium text size and Persian settings/RTL persistence pass. Screen-reader/device matrix pending.
- [x] P1-T07 SQLite adapter, transactional migrations, repositories and settings migrations.
- [~] P1-T08 Managed files, native metadata/streaming SHA-256, atomic import/dedupe, journal/recovery and bounded embedded artwork; native failure matrix pending.
- [~] P1-T09 Onboarding, Home, Library and all browse dimensions.
- [~] P1-T10 Search, favorites, playlists CRUD, sorting/filtering.
- [~] P1-T11 Manual import, 10k fixture, diagnostics and functional mini-player controls; native import failure matrix remains open.
- [~] P1-T12 Android build/native tests passed in CI run 37098359433. The all-files picker fix was included in run 37100739974, but Android E2E failed; exact assertion is pending log access.
- [x] P1-T13 iOS Debug build, iOS 27 simulator boot and two native UI tests pass after Pod target and scene-lifecycle fixes (2026-10-02).
- [~] P1-T14 Accessibility/device matrix, component/E2E and 10k benchmark gates; earlier iOS simulator audits passed, but run 37100739974 iOS smoke failed. Android E2E, screen-reader and physical-device evidence pending.

Phase 1 is PARTIAL. Evidence and remaining acceptance items are in `docs/phases/PHASE_01_FOUNDATION.md` and `docs/qa/`. Physical-device and screen-reader gates cannot be marked complete from simulator evidence. Phase 2 implementation has begun at the user's request; its exit remains open.

## Phase 2 — Native audio

- [~] P2-T01 Media3 ExoPlayer session service, foreground permission/notification path, audio focus/noisy handling and bridge implemented; an earlier Android CI build passed, current-source CI and device playback pending.
- [~] P2-T02 iOS AVPlayer, playback session/background mode, Now Playing, play/pause/seek remote commands, preferred speed and basic interruption/route handling implemented; an earlier simulator Debug build and UI smoke passed, current-source native build and playback/device matrix pending.
- [~] P2-T03 Persisted selected track, position, manual/shuffled queue, repeat mode and speed with paused restore, completion advance/wrap and 1-second poll; native queue/system next, lifecycle stress and crash recovery remain open.
- [~] P2-T04 Accessible seek control, queue sheet/removal/direct skip, mini-player previous/play-pause/next, native sleep timer and A–B repeat; gesture editor and device verification remain open.
- [ ] P2-T05 Cross-platform DSP, presets, ReplayGain, artwork/Skia and visualizer.
- [ ] P2-T06 Real-device interruption matrix, codec tests and 1h soak.

## Phase 3 — Telegram

- [!] P3-T01 Own API credentials, native TDLib packaging, secure keys and auth; credentials/native integration and `BLOCKER-TELEGRAM-COMPLIANCE` pending.
- [~] P3-T02 Persisted opt-in consent, Saved Messages/private-chat scope, network, pause, exclusion and storage policy with honest unavailable connection state; auth and native execution pending.
- [~] P3-T03 Bounded scanner reconciles new messages and older backfill with transactional SQLite cursors and bounded transient retries; TDLib adapter/device evidence pending.
- [~] P3-T04 Policy-gated import core reuses atomic managed import, hash dedupe and provenance; bounded scheduler and temp cleanup exist, TDLib transfer/progress UI pending.
- [~] P3-T05 Persisted pause/exclusion gates, later-scan reconciliation and scheduler disconnect; TDLib updates and retention/device tests pending.
- [ ] P3-T06 Dedicated-account Android/iOS tests and current terms compliance gate.

## Phase 4 — Advanced experience

- [~] P4-T01 Local plain/LRC lyrics, SQLite cache, active line and offset UI; bounded native embedded extraction added for iOS and Android MP3. Device verification, other Android formats and approved-provider/licensing gate pending.
- [~] P4-T02 Bounded on-device artist/genre/album recommendations now query playable matches beyond the first title page; provider adapters and device checks pending.
- [~] P4-T03 Disabled licensed-provider/transfer contract and rights/URL/storage gates reuse managed import; approved provider, native transfer and UI pending.
- [ ] P4-T04 Android widget and iOS WidgetKit/App Intents.
- [ ] P4-T05 Advanced EQ/gestures/visuals and responsive accessibility/performance.

## Phase 5 — Release

- [~] P5-T01 Source recovery/storage audit recorded; export/restore, corruption and native failure gates pending.
- [~] P5-T02 Initial privacy/source and Telegram terms audit, unused iOS location-purpose cleanup, local license inventory; formal SBOM, full legal/license/localization gates pending.
- [ ] P5-T03 Device performance, battery/thermal/memory, 24h playback and upgrade tests.
- [~] P5-T04 Manual unsigned release preflight workflow and Android environment-based signing/version inputs added; run, signed CI and device smoke pending.
- [~] P5-T05 Android/iOS guides and exact input list updated; verified signed AAB/APK and iOS archive/TestFlight artifacts pending.
