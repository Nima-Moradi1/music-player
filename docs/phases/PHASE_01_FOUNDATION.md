# Phase 1 — Foundation

Status: PARTIAL
Source: `docs/IMPLEMENTATION_SPEC.md`, section 27.
Gate: all mandatory tasks, design demonstrations, native builds, accessibility baseline and basic E2E must pass before Phase 2.

### P1-T01 — Repository and contract

Status: DONE
Depends: none
Files: docs/IMPLEMENTATION_SPEC.md, docs/adr/, HANDOFF.md, IMPLEMENTATION_STATUS.md, phase/privacy/security guides
Acceptance:

- Preserve supplied contract; record exact gates and resume point.

Tests:

- Tracking reviewed against sections 24–27 and 39.

### P1-T02 — Public GitHub and categorized commits

Status: DONE
Depends: P1-T01
Files: Git history and origin
Acceptance:

- Public Nima-Moradi1/music-player; isolated feature commits with meaningful bodies; push source/tracking.

Tests:

- Remote repository and feature branch verified.

### P1-T03 — Bare native project

Status: DONE
Depends: P1-T01
Files: app/android/, app/ios/, workspace/lockfile
Acceptance:

- RN 0.87.1, React 19, Hermes/New Architecture, compatible pinned dependencies, no Expo.

Tests:

- Local Android debug build and macOS simulator build pass.

### P1-T04 — Strict tooling and CI

Status: IN PROGRESS
Depends: P1-T03
Files: TypeScript/Jest/ESLint/Prettier configs, .github/workflows/quality.yml
Acceptance:

- Type/lint/format/unit/component checks, native lanes and production Metro bundle.

Tests:

- 2026-10-03 local: 51 tests/20 suites, typecheck, format and lint pass; eight existing dynamic-style lint warnings. JavaScript CI passed on aa08b05 (run 37098359433); that run also passed Android `assembleDebug testDebugUnitTest`. Local iOS 27 simulator Debug build passes with the current Telegram navigation; iOS CI was still running when recorded.

### P1-T05 — Domain contracts

Status: DONE
Depends: P1-T03
Files: app/src/domain/, shared/errors.ts
Acceptance:

- Repository ports, stable errors, conservative language inference and versioned native/provider contracts.

Tests:

- Normalization, language correction, settings fallback and import command tests pass.

### P1-T06 — Design system and accessibility

Status: IN PROGRESS
Depends: P1-T04, P1-T05
Files: app/src/design-system/, shared/i18n.ts
Acceptance:

- Tokens, dark/light/EN/FA/RTL, scalable text, 48dp controls, fallbacks, sheets/dialogs/toasts/skeletons/haptics.

Tests:

- Contrast/component tests and emulator themes/locales/switches pass. Native haptic wiring exists. iPhone 18 Pro/iOS 27 XCTest audits of Home, Library and Settings pass for hit regions, element descriptions and clipped text after replacing the placeholder app title. The same audit passed at `accessibility-medium` Dynamic Type size on 2026-10-02. Theme/language controls now expose selected state; Persian settings and Home accessibility audits plus relaunch persistence pass. Larger sizes and screen-reader traversal remain pending.

### P1-T07 — Durable local data

Status: DONE
Depends: P1-T05
Files: app/src/infrastructure/database/, database/settingsRepository.ts
Acceptance:

- 21-table first migration, one writer queue, repository-owned queries, versioned settings, transactional writes.

Tests:

- Real SQLite migration/newer-schema rejection, rollback, hash/provenance, search/favorites/corrections/playlists tests pass.

### P1-T08 — Managed native import

Status: IN PROGRESS
Depends: P1-T07
Files: domain/import/, native/ManagedMedia.ts, infrastructure/filesystem/, Kotlin/Swift modules
Acceptance:

- Bounded native stage/metadata/SHA-256, validation/hash identity, atomic promotion, cancellation/compensation, journal recovery and bounded embedded artwork. Embedded lyrics and native failure matrix remain open.

Tests:

- Import/late-cancel and SQLite journal recovery tests pass; three Kotlin safety tests passed previously. Both-platform real-file/malformed/storage matrix pending.

### P1-T09 — Offline application shell

Status: IN PROGRESS
Depends: P1-T06, P1-T07
Files: app/src/app/, features/onboarding/, features/home/, features/library/
Acceptance:

- Bootstrap/error boundary, responsive Home, paged dimensions, honest unavailable states.

Tests:

- Onboarding/library components and Android tab checks pass. Automated native E2E and iOS rendering pending.

### P1-T10 — Search, favorites and playlists

Status: IN PROGRESS
Depends: P1-T09
Files: Track/playlist repositories, features/library/, features/playlists/, features/player/
Acceptance:

- Normalized search/sorting/filters, durable favorites/playlist CRUD and row-specific language corrections.

Tests:

- SQLite/component tests and native favorite/detail actions pass. Android playlist create/rename and persisted favorite/playlist cold restart pass; membership/delete UI matrix pending.

### P1-T11 — Import, fixtures, diagnostics and preview

Status: IN PROGRESS
Depends: P1-T08, P1-T09
Files: features/imports/, features/settings/, testing/, navigation preview
Acceptance:

- System picker/cancel/progress/errors, 10k metadata seed, developer native query timings, selected-row preview without playback claims.

Tests:

- Emulator stores/browses 10k entries; MP3 import and duplicate/provenance checks pass. Full codec/storage/cancellation matrix pending.

### P1-T12 — Android build and boot

Status: IN PROGRESS
Depends: P1-T03, P1-T04
Files: scripts/android-windows.ps1, Android project, docs/release/ANDROID.md
Acceptance:

- Debug APK builds; native tests pass; installed app boots/navigates.

Tests:

- Java 21/SDK 37; x86_64 API 36.0 emulator. CI run 37098359433 passed native build/tests. Run 37099499793 imported an MP3, then DocumentsUI could not show the FLAC fixture under its `audio/*` filter. Commit 8a096a5 allows all picker files while native validation still rejects unsupported content; current CI rerun pending. Local Gradle cannot fetch Google's SDK manifests; project build inputs remain unchanged.

### P1-T13 — iOS build and boot

Status: DONE
Depends: P1-T03, P1-T04
Files: iOS project, scripts/ios-simulator-smoke.sh, CI/iOS guide
Acceptance:

- macOS simulator build and observed app boot; Windows cannot run Xcode.

Tests:

- Native simulator build/boot passed at b637fac. On 2026-10-02, Xcode 27 exposed a generated Pod resource bundle at iOS 12.4 and mandatory scene lifecycle. Podfile now raises old generated targets to the RN minimum 15.1; app adopts UIScene. Fresh Debug build and the complete `ios-simulator-smoke.sh` path pass on iPhone 18 Pro/iOS 27. The full Foundation UI scheme passes navigation and accessibility audits (two tests, zero failures). Physical iOS access remains external.

### P1-T14 — Design, performance and device gate

Status: IN PROGRESS
Depends: P1-T06, P1-T08, P1-T09, P1-T10, P1-T11, P1-T12, P1-T13
Files: docs/qa/, integration/component tests, developer diagnostics
Acceptance:

- 10k measurements, native E2E, screen readers/large font, light/dark/RTL and empty/loading/error states.

Tests:

- Desktop SQLite/Android fixture smoke and an earlier iOS 27 simulator navigation/accessibility/Persian audit passed. The complete `ios-simulator-smoke.sh` path passed on 2026-10-03 after a bounded Settings-tap retry: 3 UI tests, zero failures. Runs 37100739974 and 37123187195 subsequently failed iOS launch smoke, but run 37124962862 passed simulator build, launch and Foundation UI tests on commit 6d1a237. The earlier failure did not reproduce; physical-device and screen-reader evidence remain open. Phase 2 code was started by explicit user request while these gates remain open.
