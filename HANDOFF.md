# HANDOFF

Updated: 2026-10-03 Asia/Tehran
Branch: feature/phase-01-foundation-gates
Last code commit: 3a5b19e (pushed); see `git log -1` for latest docs commit.
Status: Phase 1 PARTIAL; Phase 2 IN PROGRESS; Phase 3 foundation IN PROGRESS.

## Current state

- RN 0.87.1 offline library, managed imports, SQLite/MMKV, EN/FA UI and native Android Media3/iOS AVPlayer playback are implemented. Player has saved position/manual queue, native sleep timer and A–B repeat. Device playback matrix remains unverified.
- Telegram preferences are reachable from Settings and persist explicit source, transfer and consent choices. Consent defaults off. Connection is honestly unavailable. Typed, bounded Main/Archive scanner core and SQLite cursors are implemented and tested, but there is no TDLib bridge, login, download or sync.
- Local verification on 2026-10-03: 51 tests/20 suites, typecheck, lint (0 errors, eight existing warnings), format check, Python compile and diff check pass.
- CI run 37098359433 passed JavaScript and Android `assembleDebug testDebugUnitTest` on native audio source. Android E2E passed onboarding/tab navigation, then stalled in DocumentsUI while Pixel Launcher showed an ANR. Picker/ANR retry was pushed in 3a5b19e; current commit rerun pending. iOS CI was still in progress when recorded. A fresh local iOS 27 simulator Debug build passes with the Telegram navigation change; three navigation/accessibility/Persian UI tests passed before that change.

## Open gates

- Phase 1: Android end-to-end import, native import/storage failure matrix, larger-text/screen-reader and physical-device audits. See `docs/phases/PHASE_01_FOUNDATION.md`.
- Phase 2: real-file playback/seek/background, system next/previous/native queue, DSP/visualizer, interruption matrix and one-hour soak. See `docs/phases/PHASE_02_AUDIO.md`.
- Phase 3: app-specific Telegram API ID/hash, TDLib Android/iOS packaging, secure key/auth, download/import integration, new-message sync, dedicated-account tests and current terms review. See `docs/phases/PHASE_03_TELEGRAM.md`. Never put credentials in Git.
- Physical Android/iOS devices are unavailable in this workspace. Local Android Gradle SDK manifests fail to load; pinned GitHub CI is the Android build path.

## Resume next

1. Inspect CI for 3a5b19e and fix remaining Android E2E picker failures. Verify iOS build after Telegram navigation change.
2. Exercise real imported audio on iOS simulator and Android emulator; implement native queue/system controls and remaining player UI.
3. Obtain app-specific Telegram credentials, package TDLib and connect auth/scanner/download pipeline. Scanner currently has no native client and must not be represented as functional Telegram import.
4. Keep phase/status evidence current and push meaningful commits.

## Important files

- `docs/IMPLEMENTATION_SPEC.md` — requirements and gates.
- `app/src/domain/telegram/`, `app/src/infrastructure/telegram/`, `app/src/features/telegram/` — Phase 3 foundation.
- `app/src/domain/playback/PlaybackController.ts`, `app/src/native/NativeAudio.ts` — playback interface.
- `app/android/app/src/main/java/com/musicplayer/media/PlaybackService.kt`, `app/ios/MusicPlayer/NativeAudio.swift` — native engines.
