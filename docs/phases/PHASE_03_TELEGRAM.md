# Phase 3 — Telegram automation

Status: IN PROGRESS (foundation only)
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 22 and 27.
Gate: login, scan, import, sync, privacy and Android/iOS device evidence must all pass. Phase 1 and 2 gates remain open; Phase 3 foundation started at the user's request.

### P3-T01 — Own credentials, TDLib, secure storage and auth

Status: BLOCKED
Implemented: no Telegram authentication is exposed; the app states that connection is unavailable.
Open: obtain this app's own `api_id`/`api_hash`, package TDLib on Android/iOS, protect TDLib database key, implement auth state machine and logout. Never commit credentials. Telegram's [API ID instructions](https://core.telegram.org/api/obtaining_api_id) require an app-specific ID for publication. TDLib's [official repository](https://github.com/tdlib/td) documents platform builds. `BLOCKER-TELEGRAM-COMPLIANCE` remains until the limited product scope is reviewed against the current API terms.

### P3-T02 — Consent and source/network/storage policy UI

Status: IN PROGRESS
Implemented: EN/FA Settings route, account-access disclosure, explicit consent switch, Saved Messages/private-chat selectors, auto-import, pause and Wi-Fi-only choices, 512 MB file cap and 2 GB storage cap. Channel/group imports are disabled by policy and scanner/import guards following the user's scope decision. Versioned MMKV policy defaults to no consent and survives relaunch. Screen explicitly says choices do not connect an account. Scanner and import guards also honor paused state and stored per-chat exclusions.
Evidence: Telegram component test and full 51-test suite passed locally on 2026-10-03.
Open: integrate policy with auth/download execution, editable storage limit, signed-in account and per-chat selection UI, native accessibility/device audit.

### P3-T03 — Main/Archive scan, cursors, cancellation and retries

Status: IN PROGRESS
Implemented: typed client port, bounded Main/Archive listing and history pages, source filtering, supported audio/document classification, `AbortSignal` cancellation and transactional SQLite newest/backfill cursors. New messages are reconciled before older backfill; a page cursor advances only after its candidates finish. IDs stay as strings to avoid 64-bit loss.
Evidence: focused scanner and real SQLite cursor tests pass.
Open: TDLib adapter, chat-selection UI and long-history/device tests. The disconnected scanner now retries bounded transient/rate-limit failures; it leaves the cursor unchanged on exhausted retries.

### P3-T04 — Download, validation, dedupe and atomic import

Status: IN PROGRESS
Implemented: an importer adapter contract gates consent, pause, exclusions, Wi-Fi, available space and storage cap; it passes Telegram chat/message provenance through the existing atomic hash-deduplicating `ImportMedia` pipeline and removes adapter-owned temporary files after import. Scanner awaits completion before cursor advancement.
Implemented: a bounded two-worker/100-pending scheduler coalesces duplicate message jobs, supports pause/resume and aborts work on disconnect. History cursors replay incomplete jobs after a crash.
Open: TDLib transfer bridge, persistent activity/progress UI and native failure tests. The adapter and scheduler are not connected or exposed as a working download.

### P3-T05 — New-message sync, pause and disconnect

Status: IN PROGRESS
Implemented: persisted pause/exclusions policy gates the disconnected scanner/import core; history reconciliation handles newly arrived messages on a later scan.
Open: TDLib update subscription, eligible new-message routing and local retention/device tests. Queue disconnect aborts pending work and leaves imported tracks untouched at the core level.

### P3-T06 — Dedicated-account and terms gate

Status: TODO
Current terms review (2026-10-03): the [official API terms](https://core.telegram.org/api/terms) require an own API ID, prominent disclosure, ordinary Telegram client behavior, and support for official sponsored messages when channels are accessible. The user chose Saved Messages/private chats only for now; channels and groups are disabled. A product/compliance review is still required before TDLib activation. Open: dedicated test account and Android/iOS auth/import/resume tests.
