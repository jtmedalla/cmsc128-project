import { Injectable, type OnModuleInit } from '@nestjs/common';
import {
  contactNumberSchema,
  type IntakeField,
  parseSeverity,
  SEVERITY_LABELS,
  type SourceChannel,
} from '@repo/shared';
import { ChannelsService } from '../channels/channels.service.js';
import type { RecordedMessage } from '../channels/message-log.service.js';
import { BarangayService } from '../geo/barangay.service.js';
import { IntakeService } from './intake.service.js';

export const RECEIVED_REPLY =
  'We received your report. MDRRMO responders can see it now.';
export const DONE_REPLY =
  'Thank you. Responders have your report and may call you for details.';

/** Starts another report, as a tap or typed in any case. */
export const NEW_REPORT_CHOICE = 'New report';

export const QUESTIONS: Record<IntakeField, string> = {
  incidentType: 'What happened?',
  barangay: 'Which barangay is it in?',
  severity: 'How serious is it?',
  contactNumber: 'What number can responders call you on?',
};

export const RETRIES: Record<IntakeField, string> = {
  incidentType: 'Please pick the closest one.',
  barangay: "We couldn't find that barangay. Please check the spelling.",
  severity: 'Please pick one.',
  contactNumber: 'Please send a mobile number like 09171234567.',
};

interface Turn {
  channel: SourceChannel;
  residentId: string;
  reportId: string;
}

/**
 * Turns residents' chat messages into reports, then asks for the details the
 * report still lacks, one at a time. A message that isn't a report's first is
 * read as the answer to the question asked last. Sending
 * {@link NEW_REPORT_CHOICE} starts another report.
 */
@Injectable()
export class ChatIntakeService implements OnModuleInit {
  constructor(
    private readonly channels: ChannelsService,
    private readonly intake: IntakeService,
    private readonly barangays: BarangayService,
  ) {}

  onModuleInit() {
    this.channels.onMessage((thread, message, recorded) =>
      this.handle(
        thread.adapter.name as SourceChannel,
        recorded,
        message.text.trim(),
      ),
    );
  }

  async handle(
    channel: SourceChannel,
    recorded: RecordedMessage,
    text: string,
  ) {
    const { reportId, created } = await this.intake.receiveMessage({
      ...recorded,
      channel,
      newReport: text.toLowerCase() === NEW_REPORT_CHOICE.toLowerCase(),
    });
    const turn = { channel, residentId: recorded.residentId, reportId };
    // TODO(#33): reply through confirmReport once it lands.
    if (created) await this.reply(turn, RECEIVED_REPLY);

    const missing = await this.intake.missingFields(reportId);
    // Nothing was asked yet, or everything is answered.
    if (created || !missing.length) return this.askNext(turn, missing, created);

    const [field] = missing as [IntakeField, ...IntakeField[]];
    if (!(await this.answer(turn, field, text))) {
      return this.ask(turn, field, RETRIES[field]);
    }
    await this.askNext(turn, missing.slice(1), true);
  }

  private async askNext(
    turn: Turn,
    missing: IntakeField[],
    justChanged: boolean,
  ) {
    const [next] = missing;
    if (next) return this.ask(turn, next);
    // Thank once, right after the last answer, and stay quiet after that.
    if (justChanged) await this.reply(turn, DONE_REPLY, [NEW_REPORT_CHOICE]);
  }

  /** Saves the answer; false if it doesn't fit the question. */
  private async answer(turn: Turn, field: IntakeField, text: string) {
    switch (field) {
      case 'incidentType': {
        const key = text.toLowerCase();
        const type = (await this.intake.incidentTypes()).find(
          ({ code, name }) => code === key || name.toLowerCase() === key,
        );
        if (type)
          await this.intake.answer(turn.reportId, { incidentTypeId: type.id });
        return Boolean(type);
      }
      case 'barangay': {
        const barangay = text ? await this.barangays.findByName(text) : null;
        if (barangay)
          await this.intake.answer(turn.reportId, { barangayId: barangay.id });
        return Boolean(barangay);
      }
      case 'severity': {
        const severity = parseSeverity(text);
        if (severity) await this.intake.answer(turn.reportId, { severity });
        return Boolean(severity);
      }
      case 'contactNumber': {
        const parsed = contactNumberSchema.safeParse(text);
        if (parsed.success) {
          await this.intake.saveContactNumber(turn.residentId, parsed.data);
        }
        return parsed.success;
      }
    }
  }

  private async ask(turn: Turn, field: IntakeField, prefix?: string) {
    const question = prefix
      ? `${prefix} ${QUESTIONS[field]}`
      : QUESTIONS[field];
    await this.reply(turn, question, await this.choices(field));
  }

  private async choices(field: IntakeField) {
    if (field === 'incidentType') {
      return (await this.intake.incidentTypes()).map(({ name }) => name);
    }
    if (field === 'severity') return Object.values(SEVERITY_LABELS);
    return undefined;
  }

  private async reply(turn: Turn, text: string, choices?: string[]) {
    await this.channels.send(turn.residentId, turn.channel, text, {
      reportId: turn.reportId,
      choices,
    });
  }
}
