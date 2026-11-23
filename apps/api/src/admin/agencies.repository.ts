import { Inject, Injectable } from '@nestjs/common';
import type { Agency, AgencyCreate, AgencyUpdate } from '@repo/shared';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { isUniqueViolation } from '../database/errors.js';
import { agency } from '../database/schema/index.js';

/** Another agency already has the name. */
export const NAME_TAKEN = 'name_taken';

@Injectable()
export class AgenciesRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every agency, retired ones included, by name. */
  findAgencies(): Promise<Agency[]> {
    return this.db.select().from(agency).orderBy(agency.name);
  }

  async insertAgency(
    values: AgencyCreate,
  ): Promise<Agency | typeof NAME_TAKEN> {
    const [row] = await this.db
      .insert(agency)
      .values(values)
      .onConflictDoNothing({ target: agency.name })
      .returning();
    return row ?? NAME_TAKEN;
  }

  /** Null when no agency has that ID. */
  async updateAgency(
    id: string,
    changes: AgencyUpdate,
  ): Promise<Agency | null | typeof NAME_TAKEN> {
    try {
      const [row] = await this.db
        .update(agency)
        .set(changes)
        .where(eq(agency.id, id))
        .returning();
      return row ?? null;
    } catch (error) {
      if (isUniqueViolation(error)) return NAME_TAKEN;
      throw error;
    }
  }
}
