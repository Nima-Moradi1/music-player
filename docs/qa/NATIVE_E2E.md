# Native Android acceptance automation

Run the flow against a **disposable emulator** after building the current Debug APK. It clears `com.musicplayer` app data and synthesizes owned two-second sine-wave audio; physical devices are rejected before any app data changes.

```sh
export PATH="$ANDROID_HOME/platform-tools:$PATH"
# Boot a disposable x86_64 emulator, install ffmpeg, and build assembleDebug first.
bash scripts/android-native-e2e.sh
```

Use `ANDROID_SERIAL=emulator-5554` to choose a device and `ANDROID_E2E_APK=/path/to/app-debug.apk` to choose an APK. The APK must include the current native bridge. The wrapper starts Metro when needed and terminates only the Metro process it created. The runner restores its temporary Android font/rotation settings and resets display size/density overrides.

The Android CI build now invokes the same script on an API 35 Google APIs emulator. Each running workflow finishes rather than being cancelled by the next task commit; GitHub retains the latest pending run for the same branch. The pinned [Android Emulator Runner](https://github.com/ReactiveCircus/android-emulator-runner) creates and boots the CI emulator.

The flow asserts native UI and persisted SQLite/media behavior:

- Complete onboarding and navigate all four primary tabs.
- Import generated MP3 with an embedded 1024px cover, FLAC and M4A files through the system document picker.
- Import identical MP3 bytes under a second filename; reject corrupt and zero-byte MP3s.
- Favorite a real imported song, view Favorites, and verify persistence after a cold app restart.
- Create and rename a playlist, verify restart persistence, add/remove an actual song and delete the playlist.
- Change light/dark themes and English/Persian, assert the accessibility switches report their changed checked states, and verify RTL tab order, and capture 200% font, 320dp small-screen Library and landscape tab evidence.
- Read the actual emulator SQLite database after stopping the app: three codec tracks with two-second durations and SHA-256 hashes, four provenance records, one favorite, no deleted playlist/membership rows, three managed audio files, one extracted JPEG thumbnail at most 512 pixels per side, and no leaked temporary files.

`artifacts/android-e2e/` contains a JSON result, stage screenshots/UI hierarchies, synthetic fixtures, native logcat and a copy of the emulator database. CI uploads `android-native-e2e` on success or failure. Assertions fail the job; screenshots alone never constitute an interaction pass.

The flow does not establish physical-device performance, screen-reader traversal, every adaptive layout, insufficient-storage behavior, or iOS interaction. These remain separate checks in [DEVICE_MATRIX.md](DEVICE_MATRIX.md). The existing iOS simulator launch smoke continues to capture boot logs and onboarding screenshots.

GitHub run `37100739974` completed with JavaScript success and failures in **Android Native import and library E2E** and **iOS Simulator launch smoke**. The supplied iOS console excerpt shows simulator boot, app launch and screenshot success, followed by exit 65 from `xcodebuild test`. That command redirects its output to `artifacts/ios-smoke/foundation-ui.log`, which was not included in the excerpt. The smoke script now prints its last 160 lines on failure. The failing UI assertion or build error remains unknown until that artifact or a new run is available. The user has deferred Android investigation.

## Environment observed on 2026-10-02

The local Mac has full Xcode and an iOS 27 simulator runtime, although its default developer directory points at Command Line Tools. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for local Xcode commands. Android Studio provides Java 21 at `/Applications/Android Studio.app/Contents/jbr/Contents/Home`; adb/emulator are under `~/Library/Android/sdk`. A disposable `Medium_Phone_API_36.1` emulator booted successfully. The installed local Android platform/build-tools/NDK do not match the project's pinned API 37/build-tools 37/NDK 27 configuration, so the current native APK is supplied by CI instead of silently changing build inputs. Runtime acceptance status is recorded only after the runner completes against that APK.
