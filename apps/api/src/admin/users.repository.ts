import { Inject, Injectable } from '@nestjs/common';
import type { Account, AccountUpdate, UserRole } from '@repo/shared';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { session, user } from '../database/schema/index.js';

const columns = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  banned: user.banned,
  createdAt: user.createdAt,
};

type Row = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: Date;
};

function toAccount({ banned, role, ...row }: Row): Account {
  return { ...row, role: (role ?? 'responder') as UserRole, active: !banned };
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every dashboard account, by name. */
  async findAll(): Promise<Account[]> {
    const rows = await this.db
      .select(columns)
      .from(user)
      .orderBy(asc(user.name));
    return rows.map(toAccount);
  }

  /**
   * Sets a role or active flag, or null for an unknown user. Deactivating
   * uses Better Auth's ban, which blocks sign-in, and ends the user's sessions.
   */
  async update(id: string, { role, active }: AccountUpdate) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(user)
        .set({
          role,
          ...(active !== undefined && {
            banned: !active,
            banReason: active ? null : 'Deactivated by an admin',
            banExpires: null,
          }),
        })
        .where(eq(user.id, id))
        .returning(columns);
      if (!row) return null;
      if (active === false) {
        await tx.delete(session).where(eq(session.userId, id));
      }
      return toAccount(row);
    });
  }
}
