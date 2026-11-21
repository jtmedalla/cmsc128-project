import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { IntakeField, SourceChannel } from '@repo/shared';
import type { Thread } from 'chat';
import {
  ChannelsService,
  type RecordedMessage,
} from '../channels/channels.service.js';
import { BarangayService } from '../geo/barangay.service.js';
import { IntakeService } from './intake.service.js';
import {
  firstVictimDraft,
  QUESTIONS,
  type QuestionDeps,
  type Turn,
  VICTIM_STEPS,
  type VictimDraft,
} from './questions.js';

export const RECEIVED_REPLY =
  'We received your report. MDRRMO responders can see it now.';
export const DONE_REPLY =
  'Thank you. Responders have your report and may call you for details.';
export const FOLLOW_UP_REPLY =
  'Added to your report. Tap "New report" if this is a different incident.';

/** Starts another report, as a tap or typed in any case. */
export const NEW_REPORT_CHOICE = 'New report';

/** What chat remembers between a resident's messages. */
export interface IntakeState {
  /** The person being asked about; null between rounds of questions. */
  victim?: VictimDraft | null;
}

/** The Chat SDK thread state intake reads and writes. */
export type IntakeThread = Pick<Thread<IntakeState>, 'state' | 'setState'>;

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
        thread as unknown as IntakeThread,
      ),
    );
  }

  async handle(
    channel: SourceChannel,
    recorded: RecordedMessage,
    text: string,
    thread: IntakeThread,
  ) {
    const { intake } = this.deps;
    const { reportId, created } = await intake.receiveMessage({
      ...recorded,
      channel,
      newReport: text.toLowerCase() === NEW_REPORT_CHOICE.toLowerCase(),
    });
    const turn = { channel, residentId: recorded.residentId, reportId };

    if (created) {
      // TODO(#33): reply through confirmReport once it lands.
      await this.reply(turn, RECEIVED_REPLY);
      return this.askNext(turn, thread);
    }

    // A draft from an older report is stale and ignored.
    const draft = (await thread.state)?.victim;
    if (draft?.reportId === reportId) {
      return this.answerVictim(turn, thread, draft, text);
    }

    const [field] = await intake.missingFields(reportId);
    // Thanked already; later messages stay on the report as updates.
    if (!field) return this.finish(turn, FOLLOW_UP_REPLY);
    // Asked before, but the draft expired: start the person over.
    if (field === 'victims') return this.askNext(turn, thread);

    if (!(await QUESTIONS[field].answer(text, turn, this.deps))) {
      return this.ask(turn, field, QUESTIONS[field].retry);
    }
    // Rechecked, since an answer can add a field ("Yes" asks for victims).
    await this.askNext(turn, thread);
  }

  /** Asks the first missing field, or thanks the resident if none is. */
  private async askNext(turn: Turn, thread: IntakeThread) {
    const [next] = await this.deps.intake.missingFields(turn.reportId);
    if (next === 'victims') {
      const draft = firstVictimDraft(turn.reportId);
      await thread.setState({ victim: draft });
      return this.askVictim(turn, draft);
    }
    if (next) return this.ask(turn, next);
    await this.finish(turn, DONE_REPLY);
  }

  private async answerVictim(
    turn: Turn,
    thread: IntakeThread,
    draft: VictimDraft,
    text: string,
  ) {
    const step = VICTIM_STEPS[draft.step];
    // Locked from rereading the draft to saving the next one: two quick
    // messages could otherwise both answer "How are they hurt?" and save the
    // same person twice.
    const answered = await this.deps.intake.withVictimLock(
      turn.reportId,
      async () => {
        const current = (await thread.state)?.victim;
        if (current?.step !== draft.step || current.saved !== draft.saved) {
          return null;
        }
        const next = await step.answer(text, draft, this.deps);
        if (next !== undefined) await thread.setState({ victim: next });
        return { next };
      },
    );
    // An earlier message answered it; this one stays on the report.
    if (!answered) return;
    const { next } = answered;
    if (next === undefined) return this.askVictim(turn, draft, step.retry);
    if (next) return this.askVictim(turn, next);
    await this.askNext(turn, thread);
  }

  private async ask(
    turn: Turn,
    field: Exclude<IntakeField, 'victims'>,
    prefix?: string,
  ) {
    const { ask, choices } = QUESTIONS[field];
    await this.reply(turn, withPrefix(ask, prefix), await choices?.(this.deps));
  }

  private askVictim(turn: Turn, draft: VictimDraft, prefix?: string) {
    const { ask, choices } = VICTIM_STEPS[draft.step];
    return this.reply(turn, withPrefix(ask(draft), prefix), choices);
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

function withPrefix(text: string, prefix?: string) {
  return prefix ? `${prefix} ${text}` : text;
}
