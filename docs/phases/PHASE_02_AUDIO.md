# Phase 2 — Native audio

Status: IN PROGRESS
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 22 and 27.
Gate: all mandatory tasks and real-device exit criteria must pass. Phase 1 gate remains open; Phase 2 code was started by explicit user request.

### P2-T01 — Android playback service

Status: IN PROGRESS
Files: `PlaybackService.kt`, `NativeAudioModule.kt`, manifest, Gradle.
Implemented: Media3 1.11.1 ExoPlayer in `MediaSessionService`, session notification path, audio-focus/noisy handling, background playback service declaration, private managed-file validation and typed React Native bridge for load/play/pause/stop/seek/rate/volume/state.
Evidence: CI run 37098359433 passed `assembleDebug testDebugUnitTest` with the earlier native audio source. Run 37100739974 built but Android E2E failed; its assertion needs authenticated logs. Current changes have not passed native CI.
Open: native queue and remote next/previous, device focus/routes/lock screen verification, playback errors/events and lifecycle stress.

### P2-T02 — iOS playback service

Status: IN PROGRESS
Files: `NativeAudio.swift`, `NativeAudioBridge.m`, Info.plist, Xcode project.
Implemented: AVPlayer, `.playback` audio session, background audio mode, Now Playing metadata, remote play/pause/seek, pause on interruptions and removed route, private managed-file validation and typed bridge. Preferred speed persists across paused play and remote play.
Evidence: an earlier iOS 27 simulator Debug build and full launch/navigation/accessibility/Persian smoke passed (3 UI tests, zero failures). Run 37100739974 later failed simulator launch smoke; current native changes have not been compiled in CI. Real-file playback was not exercised.
Open: native queue, richer interruption/resume handling and real-device background/lock screen/routes verification.

### P2-T03 — State, queue and restore

Status: IN PROGRESS
Files: `PlaybackController.ts`, `NativeAudio.ts`, bootstrap.
Implemented: persisted track/position/manual queue, repeat off/one/all and playback speed in MMKV; paused restore after relaunch; native position polling; completion advances queue, repeats one or wraps all. Previous restarts the current song after three seconds or loads the prior queued song. Fixtures without audio cannot play.
Evidence: full JavaScript suite 65 tests/26 suites passes locally on 2026-10-03.
Implemented since the earlier pass: persisted shuffle/manual order, queue removal and direct skip.
Open: native-owned queue, completion threshold, crash and process-death matrix, system-control next/previous synchronization.

### P2-T04 — Player experience

Status: IN PROGRESS
Files: details/player, mini-player, localization.
Implemented: localized play/pause, 10-second seek, manual enqueue, queue count, next/previous, repeat mode and 1×/1.25×/1.5×/2× speed controls; native 30-minute sleep timer and A–B repeat.
Evidence: controller tests pass with current source; earlier iOS simulator build passed before current player/native changes.
Implemented since the earlier pass: accessible seek control and queue sheet in the full player; previous/play-pause/next in the mini-player.
Open: full player layout refinement, seek tooltip, gesture registry/customization and device playback checks.

### P2-T05 — DSP and visuals

Status: TODO
Open: native DSP path, EQ/presets, ReplayGain, pitch, crossfade, Skia effects, artwork palette and visualizer with accessible fallbacks.

### P2-T06 — Device and release gate

Status: TODO
Open: real-device interruption matrix, MP3/FLAC/M4A playback, background/lock-screen controls, queue/position recovery, repeated seek stress, player performance and one-hour soak.
