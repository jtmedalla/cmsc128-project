import { Inject, Injectable } from '@nestjs/common';
import {
  REPORT_EVENTS,
  type ReportInput,
  reportCreatedEventSchema,
  type SourceChannel,
} from '@repo/shared';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import {
  findFeedItem,
  findOpenReport,
  insertReport,
  linkMessage,
} from './reports.js';

export interface IncomingMessage {
  residentId: string;
  messageId: string;
  channel: SourceChannel;
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
    await this.publishCreated(created.id);
    return created;
  }

  /**
   * Files a resident's chat message under their open report, or starts a
   * pending report with it, so even a lone first message reaches the feed.
   */
  async receiveMessage({
    residentId,
    messageId,
    channel,
  }: IncomingMessage): Promise<ReceivedMessage> {
    const received = await this.db.transaction(async (tx) => {
      // Serializes a resident's messages so a burst opens one report.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`intake:${residentId}`}))`,
      );
      const open = await findOpenReport(tx, residentId, channel);
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
    if (received.created) await this.publishCreated(received.reportId);
    return received;
  }

  private async publishCreated(id: string) {
    const item = await findFeedItem(this.db, id);
    this.realtime.toDashboard(
      REPORT_EVENTS.created,
      reportCreatedEventSchema.encode(item!),
    );
  }
}
