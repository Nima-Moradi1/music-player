# Contributing

Read `HANDOFF.md`, `IMPLEMENTATION_STATUS.md`, and the current phase file before changing code. Read the public interface and tests of the subsystem you change.

Use `feature/phase-01-foundation` (then one branch per later phase). Keep commits feature-sized with an imperative subject and a body describing behavior, rationale, and verification. Never commit secrets, signing keys, device media, session databases, or diagnostics.

Features depend on domain interfaces; infrastructure and native adapters implement them. Screens never call raw native modules or another feature's private internals. Export feature APIs through `index.ts`.

Run focused tests after each meaningful task. Before pushing, run formatting, lint, strict type checking, tests, and `git diff --check`. Record unavailable native/device checks as blockers, with exact commands and next actions. Update status and handoff before stopping. Do not start a later phase before the current phase passes its exit gate.

