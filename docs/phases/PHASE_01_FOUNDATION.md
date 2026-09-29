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

Status: DONE
Depends: P1-T03
Files: TypeScript/Jest/ESLint/Prettier configs, .github/workflows/quality.yml
Acceptance:

- Type/lint/format/unit/component checks, native lanes and production Metro bundle.

Tests:

- JavaScript checks pass; eight dynamic-style lint warnings documented.

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

- Tokens, dark/light/EN/FA/RTL, scalable text, 48dp controls, fallbacks. Finish sheets/dialogs/toasts/skeletons/haptics.

Tests:

- Contrast/component tests and emulator themes/locales/switches pass. Font/screen-reader matrix pending.

### P1-T07 — Durable local data

Status: DONE
Depends: P1-T05
Files: app/src/infrastructure/database/, infrastructure/settings/
Acceptance:

- 21-table first migration, one writer queue, repository-owned queries, versioned settings, transactional writes.

Tests:

- Real SQLite migration/newer-schema rejection, rollback, hash/provenance, search/favorites/corrections/playlists tests pass.

### P1-T08 — Managed native import

Status: IN PROGRESS
Depends: P1-T07
Files: domain/import/, native/ManagedMedia.ts, infrastructure/filesystem/, Kotlin/Swift modules
Acceptance:

- Bounded native stage/metadata/SHA-256, validation/hash identity, atomic promotion, cancellation/compensation. Journal crashes and extract embedded assets.

Tests:

- Import/late-cancel tests and three Kotlin safety tests pass. Both-platform real-file/malformed/storage matrix pending.

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

- SQLite/component tests and native favorite/detail actions pass. Full playlist/restart matrix pending.

### P1-T11 — Import, fixtures, diagnostics and preview

Status: IN PROGRESS
Depends: P1-T08, P1-T09
Files: features/imports/, features/settings/, testing/, navigation preview
Acceptance:

- System picker/cancel/progress/errors, 10k metadata seed, developer native query timings, selected-row preview without playback claims.

Tests:

- Emulator stores/browses 10k entries. End-to-end audio-file import pending.

### P1-T12 — Android build and boot

Status: DONE
Depends: P1-T03, P1-T04
Files: scripts/android-windows.ps1, Android project, docs/release/ANDROID.md
Acceptance:

- Debug APK builds; native tests pass; installed app boots/navigates.

Tests:

- Java 21/SDK 37; x86_64 API 36.0 emulator. Debug build/three native tests and Android CI pass.

### P1-T13 — iOS build and boot

Status: IN PROGRESS
Depends: P1-T03, P1-T04
Files: iOS project, scripts/ios-simulator-smoke.sh, CI/iOS guide
Acceptance:

- macOS simulator build and observed app boot; Windows cannot run Xcode.

Tests:

- Native simulator build passes at a5825b5. Launch artifact requires review; physical iOS access external.

### P1-T14 — Design, performance and device gate

Status: IN PROGRESS
Depends: P1-T06, P1-T08, P1-T09, P1-T10, P1-T11, P1-T12, P1-T13
Files: docs/qa/, integration/component tests, developer diagnostics
Acceptance:

- 10k measurements, native E2E, screen readers/large font, light/dark/RTL and empty/loading/error states.

Tests:

- Desktop SQLite/Android fixture smoke pass; detailed device/accessibility evidence remains open.
