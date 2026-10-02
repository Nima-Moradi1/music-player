# HANDOFF

Updated: 2026-10-02 21:51 Asia/Tehran
Phase: 1 — Foundation, architecture, design system, local library
Branch: feature/phase-01-foundation-gates
Last commit: see `git log -1`
Status: PARTIAL

## Current state

- Bare RN 0.87.1 / React 19.2.3, Hermes/New Architecture, pnpm workspace.
- Public repository: https://github.com/Nima-Moradi1/music-player.
- Offline shell, SQLite library, native managed imports and MMKV preferences implemented.
- Android/iOS debug build and boot previously verified; fresh local JavaScript suite passes at current working tree.
- Phase 1 exit is open; Phases 2–5 have not started. Existing work is preserved in coherent feature commits on this branch.

## What changed

- DONE `app/src/features/` — onboarding, Home, library dimensions, favorites, playlists, details/settings.
- DONE `app/src/design-system/` — themes, accessible tokens/controls, EN/FA and RTL.
- DONE `app/src/infrastructure/` — transactional schema/repositories and bounded native import adapter.
- DONE `.github/workflows/quality.yml` — JavaScript, Android and macOS native build lanes.
- DONE navigation hook error, API 24 file reads, Metro namespace transform and switch touch targets.
- DONE native 10k diagnostics/search optimization — emulator search p95 reduced from 153 ms to 48 ms.
- DONE journal/cold-boot recovery, orphan reconciliation and bounded embedded artwork in commits after the previous handoff.
- DONE 2026-10-02 local Node 23 SQLite test adapter fix; 43 tests/16 suites, typecheck and format pass.
- IN PROGRESS CI JavaScript gate: feature run 37046205237 reproduced a playlist deletion test failure on Node 24. The delete completed in SQLite, but its React state update escaped the test's `act` boundary. The test now awaits the confirm press inside async `act`; all 43 tests pass locally with Node 24.18.0. A new CI run is required.
- IN PROGRESS Android CI regression: run 37028018129 fails compiling the new haptics module at `currentActivity`; local activity-reference fix is awaiting a fresh native build.
- DONE 2026-10-02 iOS Xcode 27 Debug build/scene launch and complete simulator smoke script, including a passing UI test through onboarding, Library and Settings; smoke now checks process survival.
- DONE iOS 27 accessibility audit for Home/Library/Settings after replacing `APP_NAME` with localized readable names.
- DONE iOS 27 accessibility text-size check at `accessibility-medium`: `FoundationUITests.testAccessibleHomeLibraryAndSettings` passed with zero failures; simulator content size restored to `large`.

## Decisions

- Follow supplied phase gates: Telegram and DSP remain gated by Phase 1 exit.
- Keep branding replaceable; no backend, account or telemetry.
- Managed-file native bridge uses New Architecture interoperability; see ADR-002.
- Selected-track preview opens details; it never claims playback. Fixtures contain no audio.

## Discoveries

- Windows needs Java 21 and consistent short paths for CMake; `scripts/android-windows.ps1` handles the alias.
- Android SDK platform package is `platforms;android-37.0`.
- Zod namespace exports need the Babel transform before the Worklets plugin.

## Remaining work

- TODO comprehensive accessibility baseline including screen-reader and adaptive layouts; feedback primitives and haptic wiring are implemented.
- TODO native media/storage/cancellation matrix and embedded lyrics; import journal/reconciliation and bounded artwork are implemented.
- TODO complete Android native E2E, large-font/small-screen/landscape/TalkBack/VoiceOver checks.
- TODO reference-device performance and deeper iOS import/interruption interactions.

## Blockers

- BLOCKER-P1-DEVICE — physical iOS/Android devices unavailable here; simulator checks continue independently.
- BLOCKER-P1-ANDROID-LOCAL — Google's SDK repository manifests return 404; a temporary SDK 36/NDK 28 mirror attempt reached native configuration but did not reach app Kotlin. Original build.gradle and ignored local.properties were restored/removed. Pinned CI build is the next verification path.

## Next steps

1. Finish the in-flight Android/iOS jobs in CI run 37046205237, then push the Node 24 playlist test fix and confirm the complete quality workflow.
2. Close the remaining accessibility and native media/storage/E2E matrix in Phase 1; journal/reconciliation and bounded artwork are implemented.
3. Extend iOS simulator import interactions and verify screen-reader/large-font behavior on native devices.
4. Only after the Phase 1 exit gate passes, start the Phase 2 native audio engine.

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
- PASS `pnpm test` — 43 tests in 16 suites on 2026-10-02.
- PASS Node 24.18.0 full Jest suite — 43 tests/16 suites after wrapping the playlist delete interaction in async `act`; previous feature CI JavaScript job failed before this fix.
- PASS `pnpm format:check`; `git diff --check`.
- PASS `./scripts/android-windows.ps1 -JavaHome '<JDK21>' -AndroidSdk '<SDK>'` — debug build/three native tests.
- PASS `pnpm --filter @music-player/app exec react-native bundle --platform android --dev false --entry-file index.js --bundle-output ../artifacts/index.android.bundle --assets-dest ../artifacts/android --max-workers 2`.
- PASS Android: onboarding/tabs/themes/EN/FA/10k rows/favorites/details, MP3 import/hash dedupe, persisted playlist rename.
- HISTORICAL PASS iOS simulator boot: onboarding screenshot/logs reviewed in `ios-simulator-smoke` artifact.
- PASS 2026-10-02 local iPhone 18 Pro/iOS 27 Debug build and `FoundationUITests.testOnboardingLibraryAndSettings`; screenshot confirms onboarding after UIScene migration.
- HISTORICAL PASS native build/boot CI: https://github.com/Nima-Moradi1/music-player/actions/runs/36572421544. Latest committed run 37028018129 failed Android compile and a playlist test; the local working tree contains fixes awaiting native/CI verification.
- PASS complete local `ios-simulator-smoke.sh` with Xcode 27: app process survived and navigation UI test passed; the script runs the full UI scheme in CI.
- PASS full Foundation UI scheme: navigation and iOS 27 accessibility audit, two tests, zero failures.
- PASS iOS 27 simulator at `accessibility-medium` content size: Home/Library/Settings accessibility audit, one test, zero failures (`artifacts/qa/ios-large-text-test.log`).
- PENDING Android current-source build/E2E, full native import/recovery and accessibility/device matrix. Local SDK manifests (`repository2-3.xml`/`repository2-4.xml`) returned 404; ignored mirror/substitution attempt did not reach app Kotlin and left project inputs unchanged.
