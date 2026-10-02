# Recovery requirements

Implemented: transactional schema creation, rejection of newer schemas, database close on failed bootstrap, compensating removal on failed import commit, duplicate content/provenance handling, cancellation cleanup, import journaling and cold-boot reconciliation. Integration tests use real SQLite; file-transaction tests use explicit native-port doubles. Recovery preserves committed audio/artwork ownership and deletes orphan temp or promoted files before imports resume.

Remaining Phase 1 gates:

- Verify journal/reconciliation on both native platforms during forced process death and storage failures.
- Extract embedded lyrics with bounded native decoding; embedded artwork is implemented.
- Exercise storage exhaustion and malformed media on both native platforms.
- Verify native module serialization and cancellation under rapid import/background transitions.

Do not declare crash-safe managed import complete until these are implemented and tested. Backup export/restore, corruption recovery, dangerous-migration backups and signing belong to the later release phase.
