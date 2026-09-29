import type {
  Database,
  DatabaseSession,
  SqlValue,
  SqlRow,
} from '../infrastructure/database/contracts';

// Node's real SQLite is used only in integration tests and desktop benchmarks, never bundled.
export function nodeTestDatabase(): Database {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {DatabaseSync} = require('node:sqlite') as {
    DatabaseSync: new (path: string) => {
      prepare(sql: string): {
        columns(): unknown[];
        all(...params: SqlValue[]): SqlRow[];
        run(...params: SqlValue[]): {changes: number | bigint};
      };
      close(): void;
    };
  };
  const connection = new DatabaseSync(':memory:');
  const session: DatabaseSession = {
    async execute(sql: string, params: SqlValue[] = []) {
      const statement = connection.prepare(sql);
      if (statement.columns().length) {
        return {rows: statement.all(...params) as SqlRow[], rowsAffected: 0};
      }
      const result = statement.run(...params);
      return {rows: [], rowsAffected: Number(result.changes)};
    },
  };
  return {
    execute: session.execute,
    transaction: async work => {
      await session.execute('BEGIN IMMEDIATE');
      try {
        const result = await work(session);
        await session.execute('COMMIT');
        return result;
      } catch (error) {
        await session.execute('ROLLBACK');
        throw error;
      }
    },
    close: () => connection.close(),
  };
}
