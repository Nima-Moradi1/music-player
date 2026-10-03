# Phase 5 ? Production release

Status: IN PROGRESS (source audit and release preparation only)
Source: docs/IMPLEMENTATION_SPEC.md, section 27.
Gate: all mandatory tasks, tests and phase exit criteria must pass.

### P5-T01 ? Recovery, storage, migrations, backup/restore and offline/security audit.

Status: IN PROGRESS
Depends: Phase 4 exit gate
Files: docs/release/, .github/workflows/
Acceptance:

- Implement the corresponding section 27 requirements and honest unavailable/error states.
- Source audit: import journal recovery and transactional migrations exist; Android system backup is disabled, no in-app export/restore exists. `docs/release/READINESS.md` records the open recovery and storage gates.
- Update HANDOFF/status and commit a coherent change.
  Tests:
- Focused unit/integration tests and relevant native/device gates in section 22.

### P5-T02 ? License/SBOM, privacy, provider/Telegram terms and localization audit.

Status: IN PROGRESS
Depends: Phase 4 exit gate
Files: docs/release/, .github/workflows/
Acceptance:

- Implement the corresponding section 27 requirements and honest unavailable/error states.
- Removed an unused empty iOS location purpose string. Dependency/license, provider and Telegram terms reviews remain open in `docs/release/READINESS.md`.
- Local installed-package license inventory script and manual CI artifact are prepared. Official Telegram API terms were reviewed on 2026-10-03; limited Saved Messages/private-chat scope still has `BLOCKER-TELEGRAM-COMPLIANCE` until product review. A full SBOM and license obligations review remain open.
- Update HANDOFF/status and commit a coherent change.
  Tests:
- Focused unit/integration tests and relevant native/device gates in section 22.

### P5-T03 ? Device performance, battery/thermal/memory, 24h playback and upgrade tests.

Status: TODO
Depends: Phase 4 exit gate
Files: docs/release/, .github/workflows/
Acceptance:

- Implement the corresponding section 27 requirements and honest unavailable/error states.
- Update HANDOFF/status and commit a coherent change.
  Tests:
- Focused unit/integration tests and relevant native/device gates in section 22.

### P5-T04 ? Native/E2E/release CI, versioning, signing and smoke tests.

Status: IN PROGRESS
Depends: Phase 4 exit gate
Files: docs/release/, .github/workflows/
Acceptance:

- Implement the corresponding section 27 requirements and honest unavailable/error states.
- Manual `release-preflight.yml` compiles unsigned Android APK/AAB and iOS Release simulator app and uploads a license inventory. Android Gradle reads version and upload-signing environment variables. No preflight run, signed artifact or device smoke has passed yet.
- Update HANDOFF/status and commit a coherent change.
  Tests:
- Focused unit/integration tests and relevant native/device gates in section 22.

### P5-T05 ? Verified Android AAB/APK and iOS archive/TestFlight guides and artifacts.

Status: IN PROGRESS
Depends: Phase 4 exit gate
Files: docs/release/, .github/workflows/
Acceptance:

- Implement the corresponding section 27 requirements and honest unavailable/error states.
- `docs/release/ANDROID.md`, `IOS.md` and `INPUTS.md` record the current configuration and needed identities/credentials. Android signed AAB/APK and iOS archive/TestFlight artifacts remain unavailable.
- Update HANDOFF/status and commit a coherent change.
  Tests:
- Focused unit/integration tests and relevant native/device gates in section 22.
