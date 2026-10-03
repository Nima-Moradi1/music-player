# HANDOFF

Updated: 2026-10-03 Asia/Tehran
Branch: main
Last code commit: see `git log -1` (local, not pushed).
Status: Phase 1 PARTIAL; Phases 2–5 IN PROGRESS; Telegram connection blocked on credentials and compliance review.

## Current state

- RN 0.87.1 offline library, managed imports, SQLite/MMKV and EN/FA UI are intact. Android Media3 and iOS AVPlayer engines support basic playback, native sleep timer and A–B repeat. Controller now persists position, manual queue, repeat off/one/all and playback speed; player exposes previous/next, repeat and speed controls. iOS preferred speed persists through paused and remote play.
- Phase 2: shuffle/manual queue order persists; the full player has an accessible seek control and queue sheet, and the mini-player has previous/play-pause/next. Native-owned queue/system controls remain open.
- Phase 4: manual and bounded embedded (iOS metadata, Android MP3 ID3v2 USLT) lyrics cache locally with manual override. Discovery queries bounded playable related songs across the library and now offers user-triggered MusicBrainz recording metadata search. No online full-lyrics or download provider is connected; a recording page is never treated as an audio license.
- Phase 3 Telegram remains disconnected; own API credentials and native TDLib are still required. The user limited planned imports to Saved Messages/private chats; channel/group policy and scanner paths are disabled. Scanner retries bounded transient errors, and a bounded import scheduler supports pause/resume/disconnect. `BLOCKER-TELEGRAM-COMPLIANCE` remains until the limited scope is reviewed against current terms.
- Phase 4 licensed-download contract now guards rights, expiring HTTPS URLs and storage before shared managed import. No provider or native transfer is enabled.
- Phase 5 source audit, manual unsigned release preflight, Android upload-signing/version inputs and a local license inventory are in place. Inputs are listed in `docs/release/INPUTS.md`. No signed release artifact exists.
- Earlier local full-suite verification on 2026-10-03: 65 tests/26 suites passed. Current online-discovery changes pass three focused tests, typecheck, format check, lint (0 errors, eight existing warnings) and diff check. An earlier iOS 27 simulator Debug build and full UI smoke passed; no new native/device audit has run for these changes.
- GitHub CI run 37100739974 finished: JavaScript passed; Android native import/library E2E and iOS simulator launch smoke failed. The user-supplied iOS console excerpt shows boot, launch and screenshot success, then `xcodebuild test` exits 65; its redirected `artifacts/ios-smoke/foundation-ui.log` is still needed for the assertion. The script now prints that log tail on failure. The user deferred Android investigation.

## Open gates

- Phase 1: Android end-to-end import, native import/storage failure matrix, large-text/screen-reader and physical-device audits.
- Phase 2: real-file playback/seek/background tests, native-owned queue and system next/previous, DSP/visualizer, interruption matrix and one-hour soak.
- Phase 3: Telegram credentials, TDLib packaging/auth/transfer/update subscription, progress UI, dedicated-account tests and compliance gate for the limited scope.
- Phase 4: embedded/approved-provider lyrics and rights review, licensed audio source/native transfer, Android/iOS widgets, advanced EQ/gestures/visuals and device audits. Local lyrics, metadata discovery and disabled download contracts do not close the full phase.
- Phase 5: backup/restore, corruption and upgrade recovery, full license/SBOM/localization audits, device soaks, release preflight execution/signing and verified Android/iOS exports.
- Physical Android/iOS devices are unavailable here. Local Android Gradle SDK manifests fail to load; pinned GitHub CI remains the Android build path.

## Resume next

1. Get `artifacts/ios-smoke/foundation-ui.log` or rerun the updated smoke script to expose the actual `xcodebuild test` error; fix iOS smoke. Android investigation is deferred by the user.
2. Exercise real MP3/FLAC/M4A on devices; complete native queue/system controls, DSP/widgets and recovery/device gates.
3. Obtain the inputs in `docs/release/INPUTS.md`; connect TDLib only after the limited-scope compliance review, and providers only after rights checks.
4. Run manual unsigned release preflight and complete `docs/release/READINESS.md` gates.

## Important files

- `docs/IMPLEMENTATION_SPEC.md`, `docs/phases/PHASE_02_AUDIO.md`, `docs/phases/PHASE_04_EXPERIENCE.md` — requirements and phase evidence.
- `app/src/domain/playback/PlaybackController.ts`, `app/ios/MusicPlayer/NativeAudio.swift` — playback.
- `app/src/domain/lyrics/`, `app/src/infrastructure/database/lyricsRepository.ts`, `app/src/features/lyrics/` — local lyrics.
- `app/src/domain/recommendations/`, `app/src/features/discovery/` — local discovery.
