import { Inject, Injectable } from '@nestjs/common';
import type { ReportDetail } from '@repo/shared';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';

@Injectable()
export class ReportsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** One report with everything a responder reviews, or null if none. */
  async findDetail(id: string): Promise<ReportDetail | null> {
    const row = await this.db.query.report.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      columns: {
        trackingToken: false,
        residentId: false,
        createdBy: false,
        reviewedBy: false,
        duplicateOfId: false,
        incidentTypeId: false,
        barangayId: false,
      },
      with: {
        incidentType: { columns: { id: true, code: true, name: true } },
        barangay: { columns: { id: true, name: true } },
        resident: { columns: { id: true, name: true, contactNumber: true } },
        victims: {
          columns: { id: true, sex: true, age: true, medicalCondition: true },
        },
        messages: {
          columns: { id: true, direction: true, body: true, createdAt: true },
          orderBy: (m, { asc }) => asc(m.createdAt),
        },
      },
    });
    if (!row) return null;

    const { parseConfidence, ...rest } = row;
    return {
      ...rest,
      parseConfidence: parseConfidence as ReportDetail['parseConfidence'],
      victimCount: row.victims.length,
    };
  }
}
