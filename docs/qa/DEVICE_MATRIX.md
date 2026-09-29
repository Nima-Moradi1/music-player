# Phase 1 device gate

Legend: pending means the behavior is not verified. Component tests supplement device testing.

| Check                                          | Android emulator  | Android physical | iOS simulator | iOS physical |
| ---------------------------------------------- | ----------------- | ---------------- | ------------- | ------------ |
| Cold boot / local database                     | PASS              | pending          | PASS          | pending      |
| Onboarding / primary tabs                      | PASS              | pending          | onboarding    | pending      |
| System picker / MP3, FLAC, M4A import          | partial MP3       | pending          | pending       | pending      |
| Corrupt, executable, zero/large file rejection | partial invalid   | pending          | pending       | pending      |
| Duplicate content / provenance                 | PASS              | pending          | pending       | pending      |
| Favorites / playlists / restart persistence    | partial persisted | pending          | pending       | pending      |
| Dark/light / Persian RTL                       | PASS              | pending          | pending       | pending      |
| Dynamic Type / small screens / landscape       | pending           | pending          | pending       | pending      |
| TalkBack / VoiceOver traversal and controls    | pending           | pending          | pending       | pending      |
| Reduce motion / solid surfaces                 | PASS controls     | pending          | pending       | pending      |
| Native 10k library and search benchmark        | PASS warm query   | pending          | pending       | pending      |

Phase 1 cannot pass without its native builds, basic E2E and accessibility baseline. Real audio focus, background playback, Bluetooth/calls and codec playback are Phase 2 gates. Real Telegram requires a dedicated test account in Phase 3.

Observed on 2026-09-29: Android API 36.0, x86_64 `Medium_Phone_API_36.0`, 1080 × 2400, debug/Hermes, owned read-only emulator. Installed the locally built APK and used Metro. Onboarding, all four tabs, Settings, theme/locale changes, 10k metadata rows, favorite actions and row details rendered. Switches expose one labeled 48dp target with a checked state. TalkBack traversal and physical-device behavior are still pending.

Screenshots and visible UI hierarchy were inspected under ignored `artifacts/qa/`. The initial onboarding-to-tabs check exposed a hook-call error; commit `23d4d6c` fixes it. Native builds and iOS launch pass at `b637fac` in [GitHub Actions](https://github.com/Nima-Moradi1/music-player/actions/runs/36572421544). The `ios-simulator-smoke` artifact's onboarding screenshot and app/Metro/native logs were reviewed. iOS interaction, screen reader and physical-device checks remain pending.

Manual Android import used a self-generated two-second 440 Hz sine MP3 (32,600 bytes). System picker import produced one managed SHA-256 filename and one track with 2,038 ms native duration. Importing identical bytes under another filename kept the library at 10,001 tracks and one physical media file, preserving two provenance rows. A fake MP3 containing 50 plain-text bytes was rejected with a visible supported-file message and left no temp/extra audio file. No downloaded or copyrighted music was used.

Favorite and playlist create/rename state survived a cold app restart and were verified in the emulator's own SQLite database. Native playlist membership/remove/delete UI checks, all codecs, zero/large files, insufficient space and crash recovery still require the full matrix.
