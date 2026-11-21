import {
  INTAKE_FIELDS,
  type IntakeField,
  type ReportInput,
  reportInputSchema,
  type SourceChannel,
  type VictimInput,
} from '@repo/shared';
import { and, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { message, report, victim } from '../database/schema/index.js';

/** The database, or a transaction on it. */
export type Executor =
  Database | Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * How long a resident's report stays open after their last message.
 * Messages within it fill in the same report; later ones start a new one.
 */
export const OPEN_REPORT_MINUTES = 30;

export interface CreatedReport {
  id: string;
  /** For the resident's `/status/:token` link. */
  trackingToken: string;
}

/**
 * Saves a pending report with its victims and links its source messages.
 * Throws if a message isn't the resident's.
 */
export function insertReport(
  db: Executor,
  input: ReportInput,
): Promise<CreatedReport> {
  const { victims, messageIds, ...fields } = reportInputSchema.parse(input);
  if (victims.length) fields.anyoneHurt ??= 'yes';
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(report)
      .values(fields)
      .returning({ id: report.id, trackingToken: report.trackingToken });
    const { id } = created!;

    await insertVictims(tx, id, victims);

    if (messageIds.length) {
      const linked = await tx
        .update(message)
        .set({ reportId: id })
        .where(
          and(
            inArray(message.id, messageIds),
            eq(message.residentId, fields.residentId),
          ),
        )
        .returning({ id: message.id });
      if (linked.length !== new Set(messageIds).size) {
        throw new Error(
          `Some messages don't belong to resident ${fields.residentId}`,
        );
      }
    }

    return created!;
  });
}

/**
 * The resident's pending report on a channel that they messaged about within
 * the last {@link OPEN_REPORT_MINUTES}, or null.
 */
export async function findOpenReport(
  db: Executor,
  residentId: string,
  channel: SourceChannel,
): Promise<string | null> {
  const [row] = await db
    .select({ id: report.id })
    .from(message)
    .innerJoin(report, eq(message.reportId, report.id))
    .where(
      and(
        eq(message.residentId, residentId),
        eq(message.channel, channel),
        eq(message.direction, 'inbound'),
        eq(report.status, 'pending'),
        gt(
          message.createdAt,
          sql`now() - make_interval(mins => ${OPEN_REPORT_MINUTES})`,
        ),
      ),
    )
    .orderBy(desc(message.createdAt))
    .limit(1);
  return row?.id ?? null;
}

export async function linkMessage(
  db: Executor,
  messageId: string,
  reportId: string,
) {
  await db.update(message).set({ reportId }).where(eq(message.id, messageId));
}

/** Adds anonymous victims to a report. */
export async function insertVictims(
  db: Executor,
  reportId: string,
  victims: VictimInput[],
) {
  if (!victims.length) return;
  await db.insert(victim).values(victims.map((v) => ({ ...v, reportId })));
}

/** Report fields residents can fill in during intake. */
export type IntakeAnswers = Partial<
  Pick<
    typeof report.$inferInsert,
    'incidentTypeId' | 'barangayId' | 'severity' | 'anyoneHurt'
  >
>;

export async function updateReport(
  db: Executor,
  id: string,
  answers: IntakeAnswers,
) {
  await db.update(report).set(answers).where(eq(report.id, id));
}

/** The intake fields a report and its resident still lack, in asking order. */
export async function findMissingFields(
  db: Database,
  id: string,
): Promise<IntakeField[]> {
  const row = await db.query.report.findFirst({
    where: eq(report.id, id),
    columns: {
      incidentTypeId: true,
      barangayId: true,
      severity: true,
      anyoneHurt: true,
    },
    with: {
      resident: { columns: { contactNumber: true } },
      victims: { columns: { id: true }, limit: 1 },
    },
  });
  if (!row) throw new Error(`Report ${id} not found`);
  const known: Record<IntakeField, unknown> = {
    incidentType: row.incidentTypeId,
    barangay: row.barangayId,
    severity: row.severity,
    anyoneHurt: row.anyoneHurt,
    // Only missing once someone is hurt; filled by the first victim.
    victims: row.anyoneHurt !== 'yes' || row.victims.length ? true : null,
    contactNumber: row.resident?.contactNumber,
  };
  return INTAKE_FIELDS.filter((field) => known[field] == null);
}
