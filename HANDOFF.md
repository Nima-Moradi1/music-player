# HANDOFF

Updated: 2026-10-03 Asia/Tehran
Branch: feature/phase-01-foundation-gates
Last code commit: d146ddf (pushed); see `git log -1` for latest docs commit.
Status: Phase 1 PARTIAL; Phase 2 IN PROGRESS; Phase 3 foundation IN PROGRESS; Phase 4 local features IN PROGRESS.

## Current state

- RN 0.87.1 offline library, managed imports, SQLite/MMKV and EN/FA UI are intact. Android Media3 and iOS AVPlayer engines support basic playback, native sleep timer and A–B repeat. Controller now persists position, manual queue, repeat off/one/all and playback speed; player exposes previous/next, repeat and speed controls. iOS preferred speed persists through paused and remote play.
- Phase 4: local user-supplied plain/LRC lyrics are saved in SQLite and shown with a playback-clock active line and adjustable offset. Discover shows bounded on-device related songs by artist/genre/album with reasons and small Persian locale priority. No online lyrics, recommendation or download provider is connected.
- Phase 3 Telegram policy/scanner core remains disconnected from Telegram; own API credentials and native TDLib are still required.
- Local verification on 2026-10-03: 59 tests/25 suites, typecheck, format check, lint (0 errors, eight existing warnings), diff check and iOS 27 simulator Debug build pass. Earlier iOS navigation/accessibility/Persian smoke passed three UI tests before the latest UI additions.
- GitHub CI run 37099499793 for Telegram/picker changes was still in progress; run 37100374747 for the latest code was pending when recorded. Android native compilation previously passed on run 37098359433; its E2E stalled in DocumentsUI during a Pixel Launcher ANR. Picker retry is included in later source.

## Open gates

- Phase 1: Android end-to-end import, native import/storage failure matrix, large-text/screen-reader and physical-device audits.
- Phase 2: real-file playback/seek/background tests, native-owned queue and system next/previous, shuffle, seek slider/queue sheet, DSP/visualizer, interruption matrix and one-hour soak.
- Phase 3: Telegram credentials, TDLib packaging/auth, download/import and sync pipeline, dedicated-account tests and terms gate.
- Phase 4: embedded/approved-provider lyrics and rights review, licensed recommendation/download providers, Android/iOS widgets, advanced EQ/gestures/visuals and device audits. Local lyrics and discovery do not close the full phase.
- Physical Android/iOS devices are unavailable here. Local Android Gradle SDK manifests fail to load; pinned GitHub CI remains the Android build path.

## Resume next

1. Inspect current GitHub CI and fix Android E2E picker failures; run current UI smoke on iOS.
2. Exercise real imported MP3/FLAC/M4A playback on emulators and devices; implement native queue/system controls and DSP where supported.
3. Obtain app-specific Telegram credentials and integrate TDLib. Connect only approved lyrics/download providers after rights checks.
4. Keep phase/status evidence current and push meaningful commits.

## Important files

- `docs/IMPLEMENTATION_SPEC.md`, `docs/phases/PHASE_02_AUDIO.md`, `docs/phases/PHASE_04_EXPERIENCE.md` — requirements and phase evidence.
- `app/src/domain/playback/PlaybackController.ts`, `app/ios/MusicPlayer/NativeAudio.swift` — playback.
- `app/src/domain/lyrics/`, `app/src/infrastructure/database/lyricsRepository.ts`, `app/src/features/lyrics/` — local lyrics.
- `app/src/domain/recommendations/`, `app/src/features/discovery/` — local discovery.
