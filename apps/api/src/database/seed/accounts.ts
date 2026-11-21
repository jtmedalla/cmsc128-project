import { inArray } from 'drizzle-orm';
import { auth } from '../../auth/auth.js';
import { db } from '../client.js';
import { user } from '../schema/index.js';
import type { Accounts } from './context.js';

/** Shared by every seeded account; local development only. */
export const SEED_PASSWORD = '12345678';

const accounts = [
  {
    key: 'admin',
    email: 'admin@migo.local',
    name: 'MIGO Admin',
    role: 'admin',
  },
  {
    key: 'responder',
    email: 'responder@migo.local',
    name: 'MIGO Responder',
    role: 'responder',
  },
  {
    key: 'golez',
    email: 'golez@migo.local',
    name: 'Juan Golez',
    role: 'responder',
  },
] as const;

/**
 * Creates the dashboard accounts through Better Auth, so they can sign in.
 * Runs before the seed transaction: Better Auth writes on its own connection.
 */
export async function seedAccounts(): Promise<Accounts> {
  const existing = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(
      inArray(
        user.email,
        accounts.map((a) => a.email),
      ),
    );
  const ids = new Map(existing.map((u) => [u.email, u.id]));

  for (const account of accounts) {
    if (ids.has(account.email)) continue;
    const { user: created } = await auth.api.createUser({
      body: {
        email: account.email,
        password: SEED_PASSWORD,
        name: account.name,
        role: account.role,
      },
    });
    ids.set(account.email, created.id);
  }

  return Object.fromEntries(
    accounts.map((a) => [a.key, ids.get(a.email)!]),
  ) as unknown as Accounts;
}
