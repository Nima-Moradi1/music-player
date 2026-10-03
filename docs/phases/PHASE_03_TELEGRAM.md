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
Implemented: EN/FA Settings route, account-access disclosure, explicit consent switch, Saved Messages/private chat/channel/group selectors, auto-import, pause and Wi-Fi-only choices, 512 MB file cap and 2 GB storage cap. Versioned MMKV policy defaults to no consent and survives relaunch. Screen explicitly says choices do not connect an account. Scanner and import guards also honor paused state and stored per-chat exclusions.
Evidence: Telegram component test and full 51-test suite passed locally on 2026-10-03.
Open: integrate policy with auth/download execution, editable storage limit, signed-in account and per-chat selection UI, native accessibility/device audit.

### P3-T03 — Main/Archive scan, cursors, cancellation and retries

Status: IN PROGRESS
Implemented: typed client port, bounded Main/Archive listing and history pages, source filtering, supported audio/document classification, `AbortSignal` cancellation and transactional SQLite newest/backfill cursors. New messages are reconciled before older backfill; a page cursor advances only after its candidates finish. IDs stay as strings to avoid 64-bit loss.
Evidence: focused scanner and real SQLite cursor tests pass.
Open: TDLib adapter, rate-limit backoff, chat-selection UI and long-history/device tests. The current scanner is a core algorithm, not a connected Telegram scan.

### P3-T04 — Download, validation, dedupe and atomic import

Status: IN PROGRESS
Implemented: an importer adapter contract gates consent, pause, exclusions, Wi-Fi, available space and storage cap; it passes Telegram chat/message provenance through the existing atomic hash-deduplicating `ImportMedia` pipeline and removes adapter-owned temporary files after import. Scanner awaits completion before cursor advancement.
Open: TDLib transfer bridge, bounded download scheduler, persistent activity/progress UI and native failure tests. The adapter is not connected or exposed as a working download.

### P3-T05 — New-message sync, pause and disconnect

Status: IN PROGRESS
Implemented: persisted pause/exclusions policy gates the disconnected scanner/import core; history reconciliation handles newly arrived messages on a later scan.
Open: TDLib update subscription, eligible new-message queue, disconnect and local retention tests.

### P3-T06 — Dedicated-account and terms gate

Status: TODO
Open: dedicated test account, Android/iOS auth/import/resume tests and current [Telegram API terms](https://core.telegram.org/api/terms-of-use) review before declaring release ready.
