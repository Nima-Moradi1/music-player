# Phase 3 — Telegram automation

Status: IN PROGRESS (foundation only)
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 22 and 27.
Gate: login, scan, import, sync, privacy and Android/iOS device evidence must all pass. Phase 1 and 2 gates remain open; Phase 3 foundation started at the user's request.

### P3-T01 — Own credentials, TDLib, secure storage and auth

Status: BLOCKED
Implemented: no Telegram authentication is exposed; the app states that connection is unavailable.
Open: obtain this app's own `api_id`/`api_hash`, package TDLib on Android/iOS, protect TDLib database key, implement auth state machine and logout. Never commit credentials. Telegram's [API ID instructions](https://core.telegram.org/api/obtaining_api_id) require an app-specific ID for publication. TDLib's [official repository](https://github.com/tdlib/td) documents platform builds.

### P3-T02 — Consent and source/network/storage policy UI

Status: IN PROGRESS
Implemented: EN/FA Settings route, account-access disclosure, explicit consent switch, Saved Messages/private chat/channel/group selectors, auto-import and Wi-Fi-only choices, 512 MB cap. Versioned MMKV policy defaults to no consent and survives relaunch. Screen explicitly says choices do not connect an account.
Evidence: Telegram component test and full 51-test suite passed locally on 2026-10-03.
Open: integrate policy with auth/download execution, editable storage limit, signed-in account and per-chat selection UI, native accessibility/device audit.

### P3-T03 — Main/Archive scan, cursors, cancellation and retries

Status: IN PROGRESS
Implemented: typed client port, bounded Main/Archive listing and history pages, source filtering, supported audio/document classification, `AbortSignal` cancellation, per-message SQLite cursor write after candidate handling. IDs stay as strings to avoid 64-bit loss.
Evidence: focused scanner and real SQLite cursor tests pass.
Open: TDLib adapter, first-run and newest-message reconciliation, rate-limit backoff, per-chat exclusions and long-history/device tests. The current scanner is a core algorithm, not a connected Telegram scan.

### P3-T04 — Download, validation, dedupe and atomic import

Status: TODO
Open: TDLib file download bridge, queue limits, network/storage rules, hash and provenance integration with `ImportMedia`, cleanup and progress UI.

### P3-T05 — New-message sync, pause and disconnect

Status: TODO
Open: TDLib update subscription, eligible new-message queue, global pause, per-chat exclusions, disconnect and local retention tests.

### P3-T06 — Dedicated-account and terms gate

Status: TODO
Open: dedicated test account, Android/iOS auth/import/resume tests and current [Telegram API terms](https://core.telegram.org/api/terms-of-use) review before declaring release ready.
