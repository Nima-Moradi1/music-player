# ADR-002: bounded native media import

Status: implemented; platform build/device validation pending.

The first native media contract is version 1 and isolated in `src/native/ManagedMedia.ts`. Kotlin and Swift perform private file copies, signature/metadata checks, streaming SHA-256, and atomic moves. The JavaScript import use case serializes imports, adds provenance to existing hashes, and compensates file moves on database failure.

Use React Native's supported legacy-module interoperability under the New Architecture for this small promise-only bridge. No events, synchronous I/O, or raw native access from screens. A future TurboModule conversion preserves the TypeScript interface and requires an ADR. Cancellation uses job IDs and bounded native chunks; the commit step is non-cancellable to preserve atomicity.

Media uses hash-derived filenames, never untrusted source names. iOS managed directories are excluded from cloud backup; Android backup remains disabled. Original user files are not modified. Native metadata/artwork support, crash-orphan cleanup, and real codec tests remain explicit Phase 1 gate tasks until verified.
