import {open} from '@op-engineering/op-sqlite';
import type {Database, DatabaseSession, SqlValue, SqlRow} from './contracts';
import {AppError} from '../../shared/errors';

export function openLibraryDatabase(): Database {
  const connection = open({name: 'library.sqlite'});
  // A single writer queue prevents unrelated operations entering an active transaction.
  let tail: Promise<unknown> = Promise.resolve();
  const session: DatabaseSession = {
    async execute(sql: string, params: SqlValue[] = []) {
      try {
        const result = await connection.execute(sql, params);
        return {
          rows: result.rows as SqlRow[],
          rowsAffected: result.rowsAffected,
        };
      } catch (cause) {
        throw new AppError('DATABASE_ERROR', {cause});
      }
    },
  };
  function serialize<T>(work: () => Promise<T>): Promise<T> {
    const next = tail.then(work, work);
    tail = next.catch(() => undefined);
    return next;
  }
  return {
    execute: (sql, params) => serialize(() => session.execute(sql, params)),
    transaction: work =>
      serialize(async () => {
        await session.execute('BEGIN IMMEDIATE');
        try {
          const value = await work(session);
          await session.execute('COMMIT');
          return value;
        } catch (error) {
          await session.execute('ROLLBACK');
          throw error;
        }
      }),
    close: () => connection.close(),
  };
}
