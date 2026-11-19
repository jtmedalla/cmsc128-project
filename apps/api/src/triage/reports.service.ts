import { Inject, Injectable } from '@nestjs/common';
import {
  messageAttachmentsSchema,
  parseConfidenceSchema,
  type ReportDetail,
} from '@repo/shared';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';

@Injectable()
export class ReportsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** One report with everything a responder reviews, or null if none. */
  async findDetail(id: string): Promise<ReportDetail | null> {
    const row = await this.db.query.report.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      // Hide internal links and the tracking token; relations below replace the IDs.
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
        // Ordered by ID so the list doesn't reshuffle between loads.
        victims: {
          columns: { id: true, sex: true, age: true, medicalCondition: true },
          orderBy: (v, { asc }) => asc(v.id),
        },
        // senderId tells a responder's reply from the bot's; attachments flag location shares.
        messages: {
          columns: {
            id: true,
            direction: true,
            senderId: true,
            body: true,
            attachments: true,
            createdAt: true,
          },
          orderBy: (m, { asc }) => asc(m.createdAt),
        },
      },
    });
    if (!row) return null;

    // jsonb columns are unchecked; a bad shape becomes null instead of failing the response with a 500.
    return {
      ...row,
      parseConfidence:
        parseConfidenceSchema.safeParse(row.parseConfidence).data ?? null,
      messages: row.messages.map((m) => ({
        ...m,
        attachments:
          messageAttachmentsSchema.safeParse(m.attachments).data ?? null,
      })),
    };
  }
}
