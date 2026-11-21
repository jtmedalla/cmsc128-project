import { Inject, Injectable } from '@nestjs/common';
import { residentListItemSchema } from '@repo/shared';
import { asc, countDistinct, eq, max } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import {
  barangay,
  report,
  resident,
  residentChannel,
} from '../database/schema/index.js';

@Injectable()
export class ResidentsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list() {
    const rows = await this.db
      .select({
        id: resident.id,
        name: resident.name,
        contactNumber: resident.contactNumber,
        barangay: barangay.name,
        reportCount: countDistinct(report.id),
        broadcastsOptIn: resident.broadcastsOptIn,
        languagePreference: resident.languagePreference,
        lastMessaged: max(residentChannel.lastInboundAt),
      })
      .from(resident)
      .leftJoin(barangay, eq(resident.barangayId, barangay.id))
      .leftJoin(report, eq(report.residentId, resident.id))
      .leftJoin(residentChannel, eq(residentChannel.residentId, resident.id))
      .groupBy(resident.id, barangay.name)
      .orderBy(asc(resident.name));

    return rows.map((row) => residentListItemSchema.encode(row));
  }
}
