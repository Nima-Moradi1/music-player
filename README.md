# Music Player

A local-first, privacy-first React Native music player for Android and iOS.

Implementation follows [the supplied specification](docs/IMPLEMENTATION_SPEC.md) in five gated phases. The current work is Phase 1: the native project, accessible design system, and offline library. Playback, Telegram automation, provider downloads, and widgets are not yet available.

Read [HANDOFF.md](HANDOFF.md) for the exact resume point and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the complete checklist. No phase is declared complete without its native, component, and device gates.

## Development

Use Node 22.13+ (Node 24.18 recommended), pnpm 11.18, Android Studio/JDK 17, and Xcode on macOS for iOS. Platform setup is documented in `docs/release/` as verified commands become available.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm start
```

There is no backend and no telemetry. Audio, library metadata, playlists, and future Telegram sessions stay on the device. Branding remains replaceable through `APP_NAME`.
