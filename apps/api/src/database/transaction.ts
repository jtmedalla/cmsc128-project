import { sql } from 'drizzle-orm';
import type { Database } from './client.js';

/** The database, or a transaction on it. Repository methods accept either. */
export type Executor =
  Database | Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Holds a Postgres advisory lock on `key` until `tx` ends, so concurrent
 * requests for the same key run one at a time, across app instances.
 */
export async function advisoryLock(tx: Executor, key: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
}
