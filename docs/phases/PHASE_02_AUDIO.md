# Phase 2 — Native audio

Status: IN PROGRESS
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 22 and 27.
Gate: all mandatory tasks and real-device exit criteria must pass. Phase 1 gate remains open; Phase 2 code was started by explicit user request.

### P2-T01 — Android playback service

Status: IN PROGRESS
Files: `PlaybackService.kt`, `NativeAudioModule.kt`, manifest, Gradle.
Implemented: Media3 1.11.1 ExoPlayer in `MediaSessionService`, session notification path, audio-focus/noisy handling, background playback service declaration, private managed-file validation and typed React Native bridge for load/play/pause/stop/seek/rate/volume/state.
Evidence: source reviewed; current-source Android CI build/E2E pending.
Open: native queue and remote next/previous, device focus/routes/lock screen verification, playback errors/events and lifecycle stress.

### P2-T02 — iOS playback service

Status: IN PROGRESS
Files: `NativeAudio.swift`, `NativeAudioBridge.m`, Info.plist, Xcode project.
Implemented: AVPlayer, `.playback` audio session, background audio mode, Now Playing metadata, remote play/pause/seek, pause on interruptions and removed route, private managed-file validation and typed bridge.
Evidence: 2026-10-03 iOS 27 simulator Debug build succeeded; navigation smoke is pending for current source.
Open: native queue, richer interruption/resume handling and real-device background/lock screen/routes verification.

### P2-T03 — State, queue and restore

Status: IN PROGRESS
Files: `PlaybackController.ts`, `NativeAudio.ts`, bootstrap.
Implemented: persisted track/position/manual queue in MMKV; paused restore after relaunch; native position polling; completion advances queue; fixtures without audio cannot play.
Evidence: 2 focused controller tests for paused restore and queue completion; full JavaScript suite 45 tests/17 suites passed locally.
Open: native-owned queue, shuffle/repeat, completion threshold, crash and process-death matrix, system-control event synchronization.

### P2-T04 — Player experience

Status: IN PROGRESS
Files: details/player, mini-player, localization.
Implemented: localized play/pause, 10-second seek, manual enqueue, queue count and next controls; native 30-minute sleep timer and A–B repeat with visible buttons.
Evidence: 3 controller tests pass; iOS 27 simulator Debug build succeeds after native timer/repeat changes.
Open: full player layout, seek slider/tooltip, queue sheet, gesture registry/customization and device playback checks.

### P2-T05 — DSP and visuals

Status: TODO
Open: native DSP path, EQ/presets, ReplayGain, pitch, crossfade, Skia effects, artwork palette and visualizer with accessible fallbacks.

### P2-T06 — Device and release gate

Status: TODO
Open: real-device interruption matrix, MP3/FLAC/M4A playback, background/lock-screen controls, queue/position recovery, repeated seek stress, player performance and one-hour soak.
