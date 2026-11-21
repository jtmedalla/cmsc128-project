import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { SourceChannel } from '@repo/shared';
import type { Message, Thread } from 'chat';
import { BOT, type Bot } from './bot.js';
import {
  ChannelsRepository,
  type RecordedMessage,
} from './channels.repository.js';

export type { RecordedMessage } from './channels.repository.js';
import { sendQuickReplies } from './messenger.js';

type Handler = (
  thread: Thread,
  message: Message,
  recorded: RecordedMessage,
) => Promise<void>;

export interface SendOptions {
  reportId?: string;
  /** The responder who wrote it; omit for the bot. */
  senderId?: string;
  /**
   * Answers the resident can tap instead of typing; a tap arrives as a
   * message with that text. Listed in the text where taps aren't supported.
   */
  choices?: string[];
}

/** Messenger shares locations as coordinates, which Chat SDK drops. */
function attachmentsOf(message: Message) {
  const raw = message.raw as {
    message?: {
      attachments?: {
        type: string;
        payload?: { coordinates?: { lat: number; long: number } };
      }[];
    };
  };
  const locations = (raw.message?.attachments ?? []).flatMap(
    ({ type, payload }) =>
      type === 'location' && payload?.coordinates
        ? [
            {
              type,
              lng: payload.coordinates.long,
              lat: payload.coordinates.lat,
            },
          ]
        : [],
  );
  const media = message.attachments.map(({ type, url }) => ({ type, url }));
  const all = [...locations, ...media];
  return all.length ? all : null;
}

/**
 * Wraps the Chat SDK bot. Every inbound message is saved before modules see
 * it, and every outbound one after it is sent.
 */
@Injectable()
export class ChannelsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChannelsService.name);
  private readonly handlers: Handler[] = [];

  constructor(
    @Inject(BOT) private readonly bot: Bot,
    private readonly repository: ChannelsRepository,
  ) {
    bot.onDirectMessage((thread, message) => this.receive(thread, message));
  }

  async onModuleInit() {
    if (!this.bot.webhooks.messenger) {
      this.logger.warn('Messenger is disabled: FACEBOOK_* env vars are unset');
    }
    await this.bot.initialize();
  }

  async onModuleDestroy() {
    await this.bot.shutdown();
  }

  /** Runs for each new resident message, after it is saved. Keep it fast. */
  onMessage(handler: Handler) {
    this.handlers.push(handler);
  }

  /**
   * Waits for inbound messages to be saved before answering, so a failed
   * save makes the platform retry the delivery.
   */
  async handleWebhook(platform: string, request: Request) {
    const webhook = this.bot.webhooks[platform];
    if (!webhook) return new Response('Not Found', { status: 404 });
    const tasks: Promise<unknown>[] = [];
    const response = await webhook(request, {
      waitUntil: (task) => tasks.push(task),
      propagateHandlerErrors: true,
      // The Message table dedupes permanently, and Chat SDK's dedup would
      // drop the retry of a failed save.
      deduplicate: false,
    });
    const results = await Promise.allSettled(tasks);
    return results.some((result) => result.status === 'rejected')
      ? new Response('Internal Server Error', { status: 500 })
      : response;
  }

  /** Sends to a resident and saves the Message. Returns its ID. */
  async send(
    residentId: string,
    channel: SourceChannel,
    text: string,
    options: SendOptions = {},
  ) {
    const recipient = await this.repository.findExternalId(residentId, channel);
    if (!recipient) {
      throw new Error(`Resident ${residentId} has no ${channel} identity`);
    }
    const { choices, ...record } = options;
    let externalId: string;
    if (choices?.length && channel === 'messenger') {
      externalId = await sendQuickReplies(recipient, text, choices);
    } else {
      const body = choices?.length ? `${text}\n${choices.join(' · ')}` : text;
      externalId = (await this.bot.thread(`${channel}:${recipient}`).post(body))
        .id;
    }
    return this.repository.recordOutbound({
      ...record,
      residentId,
      channel,
      body: text,
      externalId,
    });
  }

  private async receive(thread: Thread, message: Message) {
    const recorded = await this.repository.recordInbound({
      channel: thread.adapter.name as SourceChannel,
      senderExternalId: message.author.userId,
      externalId: message.id,
      body: message.text.trim() || null,
      attachments: attachmentsOf(message),
    });
    if (!recorded) return;
    for (const handler of this.handlers) {
      // The message is safe in the table, so a retry can't help.
      await handler(thread, message, recorded).catch((error: unknown) =>
        this.logger.error(`Message handler failed: ${String(error)}`),
      );
    }
  }
}
