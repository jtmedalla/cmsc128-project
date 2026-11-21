import { Inject, Injectable } from '@nestjs/common';
import type { RecentAdvisory } from '@repo/shared';
import { and, eq, isNotNull } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { broadcast } from '../database/schema/index.js';

@Injectable()
export class BroadcastsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** The five most recently sent advisories, newest first, with their creator. */
  async findRecentAdvisories(): Promise<RecentAdvisory[]> {
    const rows = await this.db.query.broadcast.findMany({
      where: and(eq(broadcast.kind, 'advisory'), isNotNull(broadcast.sentAt)),
      orderBy: (row, { desc }) => desc(row.sentAt),
      limit: 5,
      columns: {
        id: true,
        kind: true,
        messageBody: true,
        sentAt: true,
      },
      with: {
        creator: {
          columns: { id: true, name: true },
        },
      },
    });

    return rows
      .filter((row) => row.sentAt !== null)
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        messageBody: row.messageBody,
        sentAt: row.sentAt!,
        createdBy: row.creator,
      }));
  }
}
