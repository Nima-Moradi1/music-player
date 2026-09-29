# HANDOFF

Updated: 2026-09-29 13:39 UTC
Phase: 1 — Foundation, architecture, design system, local library
Branch: main
Last commit: see `git log -1`
Status: PARTIAL

## Current state

- Bare RN 0.87.1 / React 19.2.3, Hermes/New Architecture, pnpm workspace.
- Public repository: https://github.com/Nima-Moradi1/music-player.
- Offline shell, SQLite library, native managed imports and MMKV preferences implemented.
- Android/iOS debug build and boot verified; JavaScript/native CI pass at `b637fac`.
- Phase 1 exit is open; Phases 2–5 have not started.

## What changed

- DONE `app/src/features/` — onboarding, Home, library dimensions, favorites, playlists, details/settings.
- DONE `app/src/design-system/` — themes, accessible tokens/controls, EN/FA and RTL.
- DONE `app/src/infrastructure/` — transactional schema/repositories and bounded native import adapter.
- DONE `.github/workflows/quality.yml` — JavaScript, Android and macOS native build lanes.
- DONE navigation hook error, API 24 file reads, Metro namespace transform and switch touch targets.
- DONE native 10k diagnostics/search optimization — emulator search p95 reduced from 153 ms to 48 ms.

## Decisions

- Follow supplied phase gates and first-session restriction: no Telegram or DSP implementation yet.
- Keep branding replaceable; no backend, account or telemetry.
- Managed-file native bridge uses New Architecture interoperability; see ADR-002.
- Selected-track preview opens details; it never claims playback. Fixtures contain no audio.

## Discoveries

- Windows needs Java 21 and consistent short paths for CMake; `scripts/android-windows.ps1` handles the alias.
- Android SDK platform package is `platforms;android-37.0`.
- Zod namespace exports need the Babel transform before the Worklets plugin.

## Remaining work

- TODO finish sheets/dialogs/toasts/skeleton primitives, haptics and comprehensive accessibility baseline.
- TODO import journal/cold-boot recovery, orphan cleanup, embedded assets and native media matrix.
- TODO complete automated native E2E, large-font/small-screen/landscape/TalkBack/VoiceOver checks.
- TODO reference-device performance and iOS interactions beyond onboarding.

## Blockers

- BLOCKER-P1-DEVICE — physical iOS/Android devices unavailable here; simulator checks continue independently.

## Next steps

1. Verify the latest main workflow and preserve the build/boot evidence below.
2. Implement and test import journaling/reconciliation before declaring crash-safe import done.
3. Close the remaining design/accessibility and native media/E2E matrix in Phase 1.
4. Only after its exit gate passes, start the Phase 2 native audio engine.

## Important files

- `docs/IMPLEMENTATION_SPEC.md` — supplied contract.
- `docs/phases/PHASE_01_FOUNDATION.md` — active task evidence/open gates.
- `docs/adr/ADR-001-local-first-native-heavy.md`, `docs/adr/ADR-002-managed-media-bridge.md` — architecture.
- `app/src/app/bootstrap/index.ts`, `app/src/app/providers/Services.tsx` — composition/state.
- `app/src/infrastructure/database/` — serialized native SQLite/repositories.
- `app/src/domain/import/importMedia.ts`, `app/src/infrastructure/filesystem/` — import transaction.
- `app/android/app/src/main/java/com/musicplayer/media/`, `app/ios/MusicPlayer/ManagedMedia.swift` — native work.
- `docs/qa/`, `docs/release/` — measured QA and debug commands.

## Verification

- PASS `pnpm typecheck`; `pnpm lint` — no errors, eight dynamic-style warnings.
- PASS `pnpm test` — 24 tests in 10 suites.
- PASS `pnpm format:check`; `git diff --check`.
- PASS `./scripts/android-windows.ps1 -JavaHome '<JDK21>' -AndroidSdk '<SDK>'` — debug build/three native tests.
- PASS `pnpm --filter @music-player/app exec react-native bundle --platform android --dev false --entry-file index.js --bundle-output ../artifacts/index.android.bundle --assets-dest ../artifacts/android --max-workers 2`.
- PASS Android: onboarding/tabs/themes/EN/FA/10k rows/favorites/details, MP3 import/hash dedupe, persisted playlist rename.
- PASS iOS simulator boot: onboarding screenshot/logs reviewed in `ios-simulator-smoke` artifact.
- PASS native build/boot CI: https://github.com/Nima-Moradi1/music-player/actions/runs/36572421544.
- PENDING full native import/recovery and accessibility/device matrix.
