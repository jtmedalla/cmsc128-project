import { Inject, Injectable } from '@nestjs/common';
import type { Hotline } from '@repo/shared';
import { and, eq, isNotNull } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { agency } from '../database/schema/index.js';

@Injectable()
export class InfoRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Public, active agencies with a number, by name. */
  async findHotlines(): Promise<Hotline[]> {
    const rows = await this.db
      .select({ name: agency.name, contactNumber: agency.contactNumber })
      .from(agency)
      .where(
        and(
          eq(agency.isPublic, true),
          eq(agency.isActive, true),
          isNotNull(agency.contactNumber),
        ),
      )
      .orderBy(agency.name);
    return rows.map((row) => ({ ...row, contactNumber: row.contactNumber! }));
  }
}
