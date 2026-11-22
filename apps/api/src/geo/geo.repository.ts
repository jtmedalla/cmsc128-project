import { Inject, Injectable } from '@nestjs/common';
import type { Barangay, BarangayUpdate, GeoPoint } from '@repo/shared';
import { eq, sql } from 'drizzle-orm';
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

  /** Updates one barangay; null when no barangay has that ID. */
  async updateBarangay(
    id: string,
    changes: BarangayUpdate,
  ): Promise<Barangay | null> {
    const [row] = await this.db
      .update(barangay)
      .set(changes)
      .where(eq(barangay.id, id))
      .returning();
    return row ?? null;
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
