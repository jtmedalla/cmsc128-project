import {
  messageAttachmentsSchema,
  parseConfidenceSchema,
  type ReportFeedItem,
} from '@repo/shared';
import { eq, type SQL } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { report } from '../database/schema/index.js';

/**
 * Report columns the feed and the detail both hide: internal links and the
 * tracking token. Relations below replace the IDs.
 */
export const reportColumns = {
  trackingToken: false,
  residentId: false,
  createdBy: false,
  reviewedBy: false,
  duplicateOfId: false,
  incidentTypeId: false,
  barangayId: false,
} as const;

/** Relations the feed and the detail both show. */
export const reportRelations = {
  incidentType: { columns: { id: true, code: true, name: true } },
  barangay: { columns: { id: true, name: true } },
} as const;

/** jsonb is unchecked; a value of the wrong shape becomes null instead of a 500. */
export function checkConfidence(value: unknown) {
  return parseConfidenceSchema.safeParse(value).data ?? null;
}

export function checkAttachments(value: unknown) {
  return messageAttachmentsSchema.safeParse(value).data ?? null;
}

/** Reports as the triage feed shows them, newest first. */
export async function findFeedItems(
  db: Database,
  where?: SQL,
): Promise<ReportFeedItem[]> {
  const rows = await db.query.report.findMany({
    where,
    orderBy: (r, { desc }) => desc(r.createdAt),
    columns: reportColumns,
    with: {
      ...reportRelations,
      resident: { columns: { id: true, name: true } },
      victims: { columns: { id: true } },
      // The card shows the message the report came from.
      messages: {
        columns: { body: true },
        orderBy: (m, { asc }) => asc(m.createdAt),
        limit: 1,
      },
    },
  });
  return rows.map(({ victims, messages, parseConfidence, ...row }) => ({
    ...row,
    parseConfidence: checkConfidence(parseConfidence),
    victimCount: victims.length,
    firstMessage: messages[0]?.body ?? null,
  }));
}

/** One feed item, e.g. to push a new report to the dashboard. */
export async function findFeedItem(db: Database, id: string) {
  const [item] = await findFeedItems(db, eq(report.id, id));
  return item ?? null;
}
