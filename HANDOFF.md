# HANDOFF

Updated: 2026-10-03 Asia/Tehran
Branch: main (after the authorized fast-forward merge)
Last published code commit: see `git log -1`; this handoff is updated before final publication.
Status: Phase 1 PARTIAL; Phases 2–5 IN PROGRESS; Telegram connection blocked on credentials and compliance review.

## Current state

- RN 0.87.1 offline library, managed imports, SQLite/MMKV and EN/FA UI are intact. Android Media3 and iOS AVPlayer engines support basic playback, native sleep timer and A–B repeat. Controller now persists position, manual queue, repeat off/one/all and playback speed; player exposes previous/next, repeat and speed controls. iOS preferred speed persists through paused and remote play.
- Phase 2: shuffle/manual queue order persists; the full player has an accessible seek control and queue sheet, and the mini-player has previous/play-pause/next. Native-owned queue/system controls remain open.
- Phase 4: local/embedded lyrics retain manual priority. User-triggered Wikisource search for EN/ES/DE/IT presents matching open-work text with page attribution; coverage is intentionally limited. Local recommendations and MusicBrainz recording metadata remain. The Downloads tab searches Wikimedia Commons audio with file-level Creative Commons metadata and a source/license view.
- Phase 3 Telegram remains disconnected; own API credentials and native TDLib are still required. The user limited planned imports to Saved Messages/private chats. Telegram's app form still returns generic `ERROR`/`[object Object]` after several numbers and networks; [bug 62207](https://bugs.telegram.org/c/62207) records the same failure. `BLOCKER-TELEGRAM-COMPLIANCE` remains until the limited scope is reviewed against current terms.
- Phase 4 Commons offers now recheck license/author/size before transfer; iOS native transfer enforces HTTPS Wikimedia upload host, size and cancellation before the shared managed import. SQLite retains provider, page, author and license URLs for track details. Native CI/device evidence is pending; Android transfer is deferred per the user's instruction.
- Phase 5 source audit, manual unsigned release preflight, Android upload-signing/version inputs and a local license inventory are in place. Inputs are listed in `docs/release/INPUTS.md`. No signed release artifact exists.
- Earlier local full-suite verification on 2026-10-03: 65 tests/26 suites passed. Current iOS-language changes pass 11 focused tests, typecheck and format checks; lint previously had 0 errors and eight existing warnings.
- GitHub CI runs 37124962862 and 37125379473 passed JavaScript, iOS simulator build, launch and Foundation UI tests, including the native song-language import change. Earlier runs 37100739974 and 37123187195 failed iOS smoke; their test assertions were redirected into unavailable artifacts, and the failure did not reproduce. The smoke script now emits test-error annotations. The user deferred Android investigation.

## Open gates

- Phase 1: Android end-to-end import, native import/storage failure matrix, large-text/screen-reader and physical-device audits.
- Phase 2: real-file playback/seek/background tests, native-owned queue and system next/previous, DSP/visualizer, interruption matrix and one-hour soak.
- Phase 3: Telegram credentials, TDLib packaging/auth/transfer/update subscription, progress UI, dedicated-account tests and compliance gate for the limited scope.
- Phase 4: iOS CI/device verification of the new Commons transfer, Android transfer after the user's deferral, widgets, advanced EQ/gestures/visuals and device audits. Limited open-catalog coverage is accepted; no further broad-provider choice is needed.
- Phase 5: backup/restore, corruption and upgrade recovery, full license/SBOM/localization audits, device soaks, release preflight execution/signing and verified Android/iOS exports.
- Physical Android/iOS devices are unavailable here. Local Android Gradle SDK manifests fail to load; pinned GitHub CI remains the Android build path.

## Resume next

1. If iOS smoke regresses, use its emitted annotations or `artifacts/ios-smoke/foundation-ui.log` for the actual assertion. Android investigation is deferred by the user.
2. Exercise real MP3/FLAC/M4A on devices; complete native queue/system controls, DSP/widgets and recovery/device gates.
3. Obtain the inputs in `docs/release/INPUTS.md`; connect TDLib after API credentials and limited-scope compliance review. Commons and Wikisource require no app credentials.
4. Run manual unsigned release preflight and complete `docs/release/READINESS.md` gates.

## Important files

- `docs/IMPLEMENTATION_SPEC.md`, `docs/phases/PHASE_02_AUDIO.md`, `docs/phases/PHASE_04_EXPERIENCE.md` — requirements and phase evidence.
- `app/src/domain/playback/PlaybackController.ts`, `app/ios/MusicPlayer/NativeAudio.swift` — playback.
- `app/src/domain/lyrics/`, `app/src/infrastructure/database/lyricsRepository.ts`, `app/src/features/lyrics/` — local lyrics.
- `app/src/domain/recommendations/`, `app/src/features/discovery/` — local discovery.
