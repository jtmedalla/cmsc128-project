import { Inject, Injectable } from '@nestjs/common';
import type { Barangay, GeoPoint } from '@repo/shared';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { toEwktPoint } from '../database/schema/columns.js';
import { barangay } from '../database/schema/index.js';

@Injectable()
export class GeoRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** All 119 barangays, by name. */
  findBarangays(): Promise<Barangay[]> {
    return this.db.select().from(barangay).orderBy(barangay.name);
  }

  /** The barangay whose boundary covers `point`, or null. */
  async findBarangayContaining(point: GeoPoint): Promise<Barangay | null> {
    const [row] = await this.db
      .select()
      .from(barangay)
      .where(
        sql`ST_Covers(${barangay.boundary}, ${toEwktPoint(point)}::geometry)`,
      )
      .limit(1);
    return row ?? null;
  }
}
