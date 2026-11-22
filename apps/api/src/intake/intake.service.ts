import { Injectable } from '@nestjs/common';
import {
  type DashboardReport,
  INTAKE_FIELDS,
  type IntakeField,
  REPORT_EVENTS,
  type ReportInput,
  reportCreatedEventSchema,
  reportUpdatedEventSchema,
  type SourceChannel,
  type VictimInput,
} from '@repo/shared';
import { RealtimeService } from '../realtime/realtime.service.js';
// The feed belongs to triage (docs/intake.md, docs/realtime.md); intake only pushes new reports to it.
import { ReportsService } from '../triage/reports.service.js';
import { type IntakeAnswers, IntakeRepository } from './intake.repository.js';

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
    private readonly repository: IntakeRepository,
    private readonly realtime: RealtimeService,
    private readonly reports: ReportsService,
  ) {}

  /**
   * The only way reports are created: Messenger, web chat, the classifier,
   * the guided form and the dashboard all call this. Pushes the report to the feed.
   */
  async createReport(input: ReportInput) {
    const created = await this.repository.insertReport(input);
    await this.publish('created', created.id);
    return created;
  }

  /** A report a responder logs from the dashboard, e.g. from a phone call (FR38). */
  createDashboardReport(input: DashboardReport, responderId: string) {
    return this.createReport({
      ...input,
      sourceChannel: 'dashboard',
      createdBy: responderId,
    });
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
    const received = await this.repository.transaction(async (tx) => {
      // Serializes a resident's messages so a burst opens one report.
      await this.repository.lock(`intake:${residentId}`, tx);
      const open = newReport
        ? null
        : await this.repository.findOpenReport(residentId, channel, tx);
      if (open) {
        await this.repository.linkMessage(messageId, open, tx);
        return { reportId: open, created: false };
      }
      const { id } = await this.repository.insertReport(
        { residentId, sourceChannel: channel, messageIds: [messageId] },
        tx,
      );
      return { reportId: id, created: true };
    });
    if (received.created) await this.publish('created', received.reportId);
    return received;
  }

  /** Intake fields the report and its resident still lack, in asking order. */
  async missingFields(reportId: string): Promise<IntakeField[]> {
    const progress = await this.repository.findProgress(reportId);
    const known: Record<IntakeField, unknown> = {
      incidentType: progress.incidentTypeId,
      barangay: progress.barangayId,
      severity: progress.severity,
      anyoneHurt: progress.anyoneHurt,
      // Only missing once someone is hurt; filled by the first victim.
      victims:
        progress.anyoneHurt !== 'yes' || progress.hasVictims ? true : null,
      contactNumber: progress.contactNumber,
    };
    return INTAKE_FIELDS.filter((field) => known[field] == null);
  }

  /** Fills in report fields from the resident's answers. */
  async answer(reportId: string, answers: IntakeAnswers) {
    await this.repository.updateReport(reportId, answers);
    await this.publish('updated', reportId);
  }

  /** Adds anonymous victims to a report; names have no field (FR9). */
  async addVictims(reportId: string, victims: VictimInput[]) {
    await this.repository.insertVictims(reportId, victims);
    await this.publish('updated', reportId);
  }

  /**
   * Runs `fn` holding the report's victim lock, so overlapping messages
   * answer each victim question once, across app instances.
   */
  withVictimLock<T>(reportId: string, fn: () => Promise<T>): Promise<T> {
    return this.repository.transaction(async (tx) => {
      await this.repository.lock(`victims:${reportId}`, tx);
      return fn();
    });
  }

  // TODO(#99): save through the profile service once it lands.
  async saveContactNumber(residentId: string, contactNumber: string) {
    await this.repository.updateContactNumber(residentId, contactNumber);
  }

  /** Active incident types, by name. */
  incidentTypes() {
    return this.repository.findActiveIncidentTypes();
  }

  /** Pushes the report's feed item to the dashboard. */
  private async publish(event: keyof typeof REPORT_EVENTS, id: string) {
    const item = await this.reports.findFeedItem(id);
    const schema =
      event === 'created' ? reportCreatedEventSchema : reportUpdatedEventSchema;
    this.realtime.toDashboard(REPORT_EVENTS[event], schema.encode(item!));
  }
}
