# HANDOFF

Updated: 2026-09-29
Phase: 1 — Foundation, architecture, design system, local library
Branch: feature/phase-01-foundation
Last commit: see `git log -1`
Status: PARTIAL

## Current state

- Bare RN 0.87.1 / React 19.2.3, Hermes/New Architecture, pnpm workspace.
- Public repository: https://github.com/Nima-Moradi1/music-player.
- Offline shell, SQLite library, native managed imports and MMKV preferences implemented.
- Android debug boots; Android/iOS native builds and JavaScript CI pass at `a5825b5`.
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
- TODO verify current iOS launch artifact and reference-device performance.

## Blockers

- BLOCKER-P1-DEVICE — physical iOS/Android devices unavailable here; simulator checks continue independently.

## Next steps

1. Check latest workflow and inspect `ios-simulator-smoke` onboarding/log artifacts.
2. Implement and test import journaling/reconciliation before declaring crash-safe import done.
3. Close the remaining design/accessibility and native media/E2E matrix in Phase 1.
4. Only after its exit gate passes, start the Phase 2 native audio engine.

## Important files

- `docs/IMPLEMENTATION_SPEC.md` — supplied contract.
- `docs/phases/PHASE_01_FOUNDATION.md` — active task evidence/open gates.
- `docs/adr/ADR-001-local-first-native-heavy.md`, `docs/adr/ADR-002-managed-media-native-boundary.md` — architecture.
- `app/src/app/bootstrap/index.ts`, `app/src/app/providers/Services.tsx` — composition/state.
- `app/src/infrastructure/database/` — serialized native SQLite/repositories.
- `app/src/domain/import/importMedia.ts`, `app/src/infrastructure/filesystem/` — import transaction.
- `app/android/app/src/main/java/com/musicplayer/media/`, `app/ios/MusicPlayer/ManagedMedia.swift` — native work.
- `docs/qa/`, `docs/release/` — measured QA and debug commands.

## Verification

- PASS `pnpm typecheck`; `pnpm lint` — no errors, eight dynamic-style warnings.
- PASS `pnpm test` — initial 22 tests; new switch and search-dimension tests pass (24 total).
- PASS `pnpm format:check`; `git diff --check`.
- PASS `./scripts/android-windows.ps1 -JavaHome '<JDK21>' -AndroidSdk '<SDK>'` — debug build/three native tests.
- PASS `pnpm --filter @music-player/app exec react-native bundle --platform android --dev false --entry-file index.js --bundle-output ../artifacts/index.android.bundle --assets-dest ../artifacts/android --max-workers 2`.
- PASS emulator: onboarding, four tabs, light/dark/EN/FA, 10k rows, favorite action and selected-row details.
- PASS native build CI: https://github.com/Nima-Moradi1/music-player/actions/runs/36570658895.
- PENDING iOS boot artifact, full native import/recovery and accessibility/device matrix.
