# Android build and release

Current target: `com.musicplayer`, minimum API 24, target API 36, compile API 37, versionCode 1. Kotlin 2.2, AGP 9.2.1, Gradle 9.4.1, NDK 27.1.12297006 and Hermes/New Architecture. The Gradle wrapper is committed.

## Debug development

Install Node 24.18, pnpm 11.18, Java 21 and the Android SDK packages used in `.github/workflows/quality.yml`. The actual SDK package is `platforms;android-37.0`, not `platforms;android-37`.

```sh
pnpm install --frozen-lockfile --fetch-timeout=600000
pnpm start
pnpm android
```

On Windows, native generated object paths may exceed 260 characters. Use the launcher from the repository root with your actual Java/SDK paths:

```powershell
./scripts/android-windows.ps1 -JavaHome 'C:\Program Files\Android\Android Studio\jbr' -AndroidSdk "$env:LOCALAPPDATA\Android\Sdk"
```

The launcher creates/reuses a workspace-only `M:` alias and keeps every autolinked path on the same drive. It never remaps another directory. Remove the alias with `subst M: /d` after stopping native builds. It uses x86_64 for emulator QA; select device architectures when preparing physical-device builds.

Debug signing uses the standard local `$HOME/.android/debug.keystore`; the key is never committed. CI creates its own debug-only key. The APK output is `app/android/app/build/outputs/apk/debug/app-debug.apk`.

## Production gate — not completed

Finalize application ID, branding, versionName/versionCode and store privacy declarations. Generate an upload key outside Git; configure release signing through local properties/environment, verify R8 and native codec/system-service behavior on physical devices, then verify `bundleRelease`/`assembleRelease` on the generated project before treating those commands as a release procedure. Release deliberately does not use debug signing.

Expected output directories are `app/android/app/build/outputs/bundle/release/` and `app/android/app/build/outputs/apk/release/`; signed AAB/APK artifacts are not yet produced. Play Console internal testing, bundle inspection and background media permissions remain Phase 5 tasks after the audio service is implemented.
