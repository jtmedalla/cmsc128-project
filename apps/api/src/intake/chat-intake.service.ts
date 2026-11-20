import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { IntakeField, SourceChannel } from '@repo/shared';
import { ChannelsService } from '../channels/channels.service.js';
import type { RecordedMessage } from '../channels/message-log.service.js';
import { BarangayService } from '../geo/barangay.service.js';
import { IntakeService } from './intake.service.js';
import { QUESTIONS, type QuestionDeps, type Turn } from './questions.js';

export const RECEIVED_REPLY =
  'We received your report. MDRRMO responders can see it now.';
export const DONE_REPLY =
  'Thank you. Responders have your report and may call you for details.';
export const FOLLOW_UP_REPLY =
  'Added to your report. Tap "New report" if this is a different incident.';

/** Starts another report, as a tap or typed in any case. */
export const NEW_REPORT_CHOICE = 'New report';

/**
 * Turns residents' chat messages into reports, then asks for the details the
 * report still lacks, one at a time. A message that isn't a report's first is
 * read as the answer to the question asked last. Sending
 * {@link NEW_REPORT_CHOICE} starts another report.
 */
@Injectable()
export class ChatIntakeService implements OnModuleInit {
  private readonly deps: QuestionDeps;

  constructor(
    private readonly channels: ChannelsService,
    intake: IntakeService,
    barangays: BarangayService,
  ) {
    this.deps = { intake, barangays };
  }

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
    const { intake } = this.deps;
    const { reportId, created } = await intake.receiveMessage({
      ...recorded,
      channel,
      newReport: text.toLowerCase() === NEW_REPORT_CHOICE.toLowerCase(),
    });
    const turn = { channel, residentId: recorded.residentId, reportId };
    const missing = await intake.missingFields(reportId);

    if (created) {
      // TODO(#33): reply through confirmReport once it lands.
      await this.reply(turn, RECEIVED_REPLY);
      return this.askNext(turn, missing);
    }

    const [field, ...rest] = missing;
    // Thanked already; later messages stay on the report as updates.
    if (!field) return this.finish(turn, FOLLOW_UP_REPLY);

    if (!(await QUESTIONS[field].answer(text, turn, this.deps))) {
      return this.ask(turn, field, QUESTIONS[field].retry);
    }
    await this.askNext(turn, rest);
  }

  /** Asks the first missing field, or thanks the resident if none is. */
  private async askNext(turn: Turn, missing: IntakeField[]) {
    const [next] = missing;
    if (next) return this.ask(turn, next);
    await this.finish(turn, DONE_REPLY);
  }

  private async ask(turn: Turn, field: IntakeField, prefix?: string) {
    const { ask, choices } = QUESTIONS[field];
    const text = prefix ? `${prefix} ${ask}` : ask;
    await this.reply(turn, text, await choices?.(this.deps));
  }

  private finish(turn: Turn, text: string) {
    return this.reply(turn, text, [NEW_REPORT_CHOICE]);
  }

  private async reply(turn: Turn, text: string, choices?: string[]) {
    await this.channels.send(turn.residentId, turn.channel, text, {
      reportId: turn.reportId,
      choices,
    });
  }
}
