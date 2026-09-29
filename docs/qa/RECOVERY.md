# Recovery requirements

Implemented: transactional schema creation, rejection of newer schemas, database close on failed bootstrap, compensating removal on failed import commit, duplicate content/provenance handling and cancellation cleanup. Integration tests use real SQLite; file-transaction tests use explicit native-port doubles.

Remaining Phase 1 gates:

- Journal each managed import before staging/promotion and reconcile unfinished imports on cold boot.
- Clean orphan temp files after a crash without deleting referenced media.
- Recover safely from a crash between atomic file promotion and database commit.
- Extract embedded artwork/lyrics with bounded native decoding.
- Exercise storage exhaustion and malformed media on both native platforms.
- Verify native module serialization and cancellation under rapid import/background transitions.

Do not declare crash-safe managed import complete until these are implemented and tested. Backup export/restore, corruption recovery, dangerous-migration backups and signing belong to the later release phase.
