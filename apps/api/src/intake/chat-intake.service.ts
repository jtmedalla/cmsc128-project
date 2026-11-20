import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { SourceChannel } from '@repo/shared';
import { ChannelsService } from '../channels/channels.service.js';
import type { RecordedMessage } from '../channels/message-log.service.js';
import { IntakeService } from './intake.service.js';

export const RECEIVED_REPLY =
  'We received your report. MDRRMO responders can see it now.';

/** Turns residents' chat messages into reports. */
@Injectable()
export class ChatIntakeService implements OnModuleInit {
  constructor(
    private readonly channels: ChannelsService,
    private readonly intake: IntakeService,
  ) {}

  onModuleInit() {
    this.channels.onMessage((thread, _message, recorded) =>
      this.handle(thread.adapter.name as SourceChannel, recorded),
    );
  }

  async handle(channel: SourceChannel, recorded: RecordedMessage) {
    const { reportId, created } = await this.intake.receiveMessage({
      ...recorded,
      channel,
    });
    // TODO(#33): reply through confirmReport once it lands.
    if (created) {
      await this.channels.send(recorded.residentId, channel, RECEIVED_REPLY, {
        reportId,
      });
    }
  }
}
