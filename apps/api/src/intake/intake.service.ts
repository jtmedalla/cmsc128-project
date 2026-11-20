import { Inject, Injectable } from '@nestjs/common';
import {
  REPORT_EVENTS,
  type ReportInput,
  reportCreatedEventSchema,
  reportUpdatedEventSchema,
  type SourceChannel,
} from '@repo/shared';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { incidentType, resident } from '../database/schema/index.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import {
  findFeedItem,
  findMissingFields,
  findOpenReport,
  type IntakeAnswers,
  insertReport,
  linkMessage,
  updateReport,
} from './reports.js';

export interface IncomingMessage {
  residentId: string;
  messageId: string;
  channel: SourceChannel;
  /** Start a new report even if the resident has an open one. */
  newReport?: boolean;
}

export interface ReceivedMessage {
  reportId: string;
  /** True when this message started a new report. */
  created: boolean;
}

@Injectable()
export class IntakeService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * The only way reports are created: Messenger, web chat, the classifier
   * and the guided form all call this. Pushes the report to the feed.
   */
  async createReport(input: ReportInput) {
    const created = await insertReport(this.db, input);
    await this.publish('created', created.id);
    return created;
  }

  /**
   * Files a resident's chat message under their open report, or starts a
   * pending report with it, so even a lone first message reaches the feed.
   * With `newReport`, it always starts one; the old report then stops taking
   * messages, since only the newest open report does.
   */
  async receiveMessage({
    residentId,
    messageId,
    channel,
    newReport = false,
  }: IncomingMessage): Promise<ReceivedMessage> {
    const received = await this.db.transaction(async (tx) => {
      // Serializes a resident's messages so a burst opens one report.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`intake:${residentId}`}))`,
      );
      const open = newReport
        ? null
        : await findOpenReport(tx, residentId, channel);
      if (open) {
        await linkMessage(tx, messageId, open);
        return { reportId: open, created: false };
      }
      const { id } = await insertReport(tx, {
        residentId,
        sourceChannel: channel,
        messageIds: [messageId],
      });
      return { reportId: id, created: true };
    });
    if (received.created) await this.publish('created', received.reportId);
    return received;
  }

  /** Intake fields the report and its resident still lack, in asking order. */
  missingFields(reportId: string) {
    return findMissingFields(this.db, reportId);
  }

  /** Fills in report fields from the resident's answers. */
  async answer(reportId: string, answers: IntakeAnswers) {
    await updateReport(this.db, reportId, answers);
    await this.publish('updated', reportId);
  }

  // TODO(#99): save through the profile service once it lands.
  async saveContactNumber(residentId: string, contactNumber: string) {
    await this.db
      .update(resident)
      .set({ contactNumber })
      .where(eq(resident.id, residentId));
  }

  /** Active incident types, by name. */
  incidentTypes() {
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

  /** Pushes the report's feed item to the dashboard. */
  private async publish(event: keyof typeof REPORT_EVENTS, id: string) {
    const item = await findFeedItem(this.db, id);
    const schema =
      event === 'created' ? reportCreatedEventSchema : reportUpdatedEventSchema;
    this.realtime.toDashboard(REPORT_EVENTS[event], schema.encode(item!));
  }
}
