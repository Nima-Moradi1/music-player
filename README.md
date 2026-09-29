# Music Player

A local-first, privacy-first React Native music player for Android and iOS.

Implementation follows [the supplied specification](docs/IMPLEMENTATION_SPEC.md) in five gated phases. The current work is Phase 1: the native project, accessible design system, and offline library. Playback, Telegram automation, provider downloads, and widgets are not yet available.

Read [HANDOFF.md](HANDOFF.md) for the exact resume point and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the complete checklist. No phase is declared complete without its native, component, and device gates.

## Development

Use Node 22.13+ (Node 24.18 recommended), pnpm 11.18, Android Studio/JDK 21, and Xcode on macOS for iOS. See the [Android guide](docs/release/ANDROID.md) and [iOS guide](docs/release/IOS.md) for the generated project's working debug commands and pending release gates.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm start
```

There is no backend and no telemetry. Audio, library metadata, playlists, and future Telegram sessions stay on the device. Branding remains replaceable through `APP_NAME`.

The offline shell includes onboarding, Home, searchable library dimensions, favorites, playlist management, language corrections, local settings and a managed native import pipeline. It uses transactional SQLite for the library and versioned MMKV settings. Discovery and Downloads clearly show their current availability; the selected-track preview opens details without claiming playback.

Development Settings can create 10,000 metadata-only fixture entries; they have no audio. Read the [performance evidence](docs/qa/PERFORMANCE.md) and [device matrix](docs/qa/DEVICE_MATRIX.md) before interpreting any benchmark or build as a completed product gate.
