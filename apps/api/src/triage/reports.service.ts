import { Inject, Injectable } from '@nestjs/common';
import type { ReportDetail, ReportFeedItem } from '@repo/shared';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import {
  checkAttachments,
  checkConfidence,
  findFeedItems,
  reportColumns,
  reportRelations,
} from './feed.js';

@Injectable()
export class ReportsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every report for the feed list, newest first. */
  // TODO(#38): sort, filters and live updates.
  findFeed(): Promise<ReportFeedItem[]> {
    return findFeedItems(this.db);
  }

  /** One report with everything a responder reviews, or null if none. */
  async findDetail(id: string): Promise<ReportDetail | null> {
    const row = await this.db.query.report.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      // Same projection as the feed, plus the contact number, victims and messages.
      columns: reportColumns,
      with: {
        ...reportRelations,
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

    return {
      ...row,
      parseConfidence: checkConfidence(row.parseConfidence),
      messages: row.messages.map((m) => ({
        ...m,
        attachments: checkAttachments(m.attachments),
      })),
    };
  }
}
