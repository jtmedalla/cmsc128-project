import { Inject, Injectable } from '@nestjs/common';
import { asc, countDistinct, eq, max } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import {
  barangay,
  report,
  resident,
  residentChannel,
} from '../database/schema/index.js';

/** Columns the directory and the profile share, so they don't drift. */
const listColumns = {
  id: resident.id,
  name: resident.name,
  contactNumber: resident.contactNumber,
  barangay: barangay.name,
  reportCount: countDistinct(report.id),
  broadcastsOptIn: resident.broadcastsOptIn,
  languagePreference: resident.languagePreference,
  lastMessaged: max(residentChannel.lastInboundAt),
};

@Injectable()
export class ResidentsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every resident with their directory columns, by name. */
  findAll() {
    return this.db
      .select(listColumns)
      .from(resident)
      .leftJoin(barangay, eq(resident.barangayId, barangay.id))
      .leftJoin(report, eq(report.residentId, resident.id))
      .leftJoin(residentChannel, eq(residentChannel.residentId, resident.id))
      .groupBy(resident.id, barangay.name)
      .orderBy(asc(resident.name));
  }

  /** One resident's profile columns, or null. */
  async findProfile(id: string) {
    const [row] = await this.db
      .select({
        ...listColumns,
        age: resident.age,
        sex: resident.sex,
        locationText: resident.locationText,
      })
      .from(resident)
      .leftJoin(barangay, eq(resident.barangayId, barangay.id))
      .leftJoin(report, eq(report.residentId, resident.id))
      .leftJoin(residentChannel, eq(residentChannel.residentId, resident.id))
      .where(eq(resident.id, id))
      .groupBy(resident.id, barangay.name);
    return row ?? null;
  }
}
