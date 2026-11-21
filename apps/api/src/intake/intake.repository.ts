import { Inject, Injectable } from '@nestjs/common';
import {
  type ReportInput,
  reportInputSchema,
  type SourceChannel,
  type VictimInput,
} from '@repo/shared';
import { and, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import {
  incidentType,
  message,
  report,
  resident,
  victim,
} from '../database/schema/index.js';
import { advisoryLock, type Executor } from '../database/transaction.js';

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

/** Report fields residents can fill in during intake. */
export type IntakeAnswers = Partial<
  Pick<
    typeof report.$inferInsert,
    'incidentTypeId' | 'barangayId' | 'severity' | 'anyoneHurt'
  >
>;

/** What a report and its resident already have, for deciding what to ask. */
export interface IntakeProgress {
  incidentTypeId: string | null;
  barangayId: string | null;
  severity: string | null;
  anyoneHurt: string | null;
  hasVictims: boolean;
  contactNumber: string | null;
}

/**
 * Intake's data access. Methods that take `tx` join the caller's
 * transaction from `transaction()`; without it they use the database.
 */
@Injectable()
export class IntakeRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  transaction<T>(fn: (tx: Executor) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  /** Holds a lock on `key` until `tx` ends. */
  lock(key: string, tx: Executor) {
    return advisoryLock(tx, key);
  }

  /**
   * Saves a pending report with its victims and links its source messages.
   * Throws if a message isn't the resident's.
   */
  insertReport(
    input: ReportInput,
    tx: Executor = this.db,
  ): Promise<CreatedReport> {
    const { victims, messageIds, ...fields } = reportInputSchema.parse(input);
    if (victims.length) fields.anyoneHurt ??= 'yes';
    return tx.transaction(async (inner) => {
      const [created] = await inner
        .insert(report)
        .values(fields)
        .returning({ id: report.id, trackingToken: report.trackingToken });
      const { id } = created!;

      await this.insertVictims(id, victims, inner);

      if (messageIds.length) {
        const linked = await inner
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
  async findOpenReport(
    residentId: string,
    channel: SourceChannel,
    tx: Executor = this.db,
  ): Promise<string | null> {
    const [row] = await tx
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

  async linkMessage(
    messageId: string,
    reportId: string,
    tx: Executor = this.db,
  ) {
    await tx.update(message).set({ reportId }).where(eq(message.id, messageId));
  }

  /** Adds anonymous victims to a report. */
  async insertVictims(
    reportId: string,
    victims: VictimInput[],
    tx: Executor = this.db,
  ) {
    if (!victims.length) return;
    await tx.insert(victim).values(victims.map((v) => ({ ...v, reportId })));
  }

  async updateReport(id: string, answers: IntakeAnswers) {
    await this.db.update(report).set(answers).where(eq(report.id, id));
  }

  /** The intake fields a report and its resident have so far. */
  async findProgress(id: string): Promise<IntakeProgress> {
    const row = await this.db.query.report.findFirst({
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
    const { resident: owner, victims, ...fields } = row;
    return {
      ...fields,
      hasVictims: victims.length > 0,
      contactNumber: owner?.contactNumber ?? null,
    };
  }

  async updateContactNumber(residentId: string, contactNumber: string) {
    await this.db
      .update(resident)
      .set({ contactNumber })
      .where(eq(resident.id, residentId));
  }

  /** Active incident types, by name. */
  findActiveIncidentTypes() {
    return this.db
      .select({
        id: incidentType.id,
        code: incidentType.code,
        name: incidentType.name,
      })
      .from(incidentType)
      .where(eq(incidentType.isActive, true))
      .orderBy(incidentType.name);
  }
}
