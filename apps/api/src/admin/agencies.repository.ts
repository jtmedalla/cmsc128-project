import { Inject, Injectable } from '@nestjs/common';
import type { Agency, AgencyCreate, AgencyUpdate } from '@repo/shared';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { isUniqueViolation } from '../database/errors.js';
import { agency, agencyReferral } from '../database/schema/index.js';
import type { Executor } from '../database/transaction.js';

/** Another agency already has the name. */
export const NAME_TAKEN = 'name_taken';

/** The outer row's ID, qualified: Drizzle drops table names in one-table selects. */
const agencyId = sql`${agency}.${sql.identifier(agency.id.name)}`;

/** Whether any referral names the agency. */
const inUse = sql<boolean>`exists (
  select 1 from ${agencyReferral} r where r.agency_id = ${agencyId}
)`;

const columns = {
  id: agency.id,
  name: agency.name,
  contactNumber: agency.contactNumber,
  isPublic: agency.isPublic,
  isActive: agency.isActive,
  inUse,
};

export type DeleteResult = 'deleted' | 'missing' | 'public' | 'in_use';

@Injectable()
export class AgenciesRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every agency, retired ones included, by name. */
  findAgencies(): Promise<Agency[]> {
    return this.db.select(columns).from(agency).orderBy(agency.name);
  }

  private async findAgency(
    id: string,
    tx: Executor = this.db,
  ): Promise<Agency | null> {
    const [row] = await tx
      .select(columns)
      .from(agency)
      .where(eq(agency.id, id));
    return row ?? null;
  }

  async insertAgency(
    values: AgencyCreate,
  ): Promise<Agency | typeof NAME_TAKEN> {
    const [row] = await this.db
      .insert(agency)
      .values(values)
      .onConflictDoNothing({ target: agency.name })
      .returning();
    return row ? { ...row, inUse: false } : NAME_TAKEN;
  }

  /** Null when no agency has that ID. */
  async updateAgency(
    id: string,
    changes: AgencyUpdate,
  ): Promise<Agency | null | typeof NAME_TAKEN> {
    try {
      return await this.db.transaction(async (tx) => {
        await tx.update(agency).set(changes).where(eq(agency.id, id));
        return this.findAgency(id, tx);
      });
    } catch (error) {
      if (isUniqueViolation(error)) return NAME_TAKEN;
      throw error;
    }
  }

  /**
   * Deletes a private agency no referral names. The row lock makes a referral
   * or a listing on hotlines wait, so neither can race the check.
   */
  deleteAgency(id: string): Promise<DeleteResult> {
    return this.db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ id: agency.id })
        .from(agency)
        .where(eq(agency.id, id))
        .for('update');
      if (!locked) return 'missing';
      const row = await this.findAgency(id, tx);
      if (row!.isPublic) return 'public';
      if (row!.inUse) return 'in_use';
      await tx.delete(agency).where(eq(agency.id, id));
      return 'deleted';
    });
  }
}
