# Phase 1 device gate

Legend: pending means the behavior is not verified. Component tests supplement device testing.

| Check                                          | Android emulator | Android physical | iOS simulator | iOS physical |
| ---------------------------------------------- | ---------------- | ---------------- | ------------- | ------------ |
| Cold boot / local database                     | PASS             | pending          | pending       | pending      |
| Onboarding / primary tabs                      | PASS             | pending          | pending       | pending      |
| System picker / MP3, FLAC, M4A import          | pending          | pending          | pending       | pending      |
| Corrupt, executable, zero/large file rejection | pending          | pending          | pending       | pending      |
| Duplicate content / provenance                 | pending          | pending          | pending       | pending      |
| Favorites / playlists / restart persistence    | partial          | pending          | pending       | pending      |
| Dark/light / Persian RTL                       | PASS             | pending          | pending       | pending      |
| Dynamic Type / small screens / landscape       | pending          | pending          | pending       | pending      |
| TalkBack / VoiceOver traversal and controls    | pending          | pending          | pending       | pending      |
| Reduce motion / solid surfaces                 | PASS controls    | pending          | pending       | pending      |
| Native 10k library and search benchmark        | PASS warm query  | pending          | pending       | pending      |

Phase 1 cannot pass without its native builds, basic E2E and accessibility baseline. Real audio focus, background playback, Bluetooth/calls and codec playback are Phase 2 gates. Real Telegram requires a dedicated test account in Phase 3.

Observed on 2026-09-29: Android API 36.0, x86_64 `Medium_Phone_API_36.0`, 1080 × 2400, debug/Hermes, owned read-only emulator. Installed the locally built APK and used Metro. Onboarding, all four tabs, Settings, theme/locale changes, 10k metadata rows, favorite actions and row details rendered. Switches expose one labeled 48dp target with a checked state. TalkBack traversal and physical-device behavior are still pending.

Screenshots and visible UI hierarchy were inspected under ignored `artifacts/qa/`. The initial onboarding-to-tabs check exposed a hook-call error; commit `23d4d6c` fixes it. Native builds at `a5825b5` pass in [GitHub Actions](https://github.com/Nima-Moradi1/music-player/actions/runs/36570658895); compilation alone does not prove iOS UI boot. The newer workflow uploads its simulator launch screenshot and logs separately.
