export type SqlValue = string | number | null;
export type SqlRow = Record<string, SqlValue>;
export interface DatabaseSession {
  execute(sql: string, params?: SqlValue[]): Promise<{rows: SqlRow[]; rowsAffected: number}>;
}
export interface Database extends DatabaseSession {
  transaction<T>(work: (session: DatabaseSession) => Promise<T>): Promise<T>;
  close(): void;
}
