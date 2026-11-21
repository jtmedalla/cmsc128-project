import { createPostgresState } from '@chat-adapter/state-pg';
import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { POOL } from '../database/database.module.js';
import { BOT, createBot } from './bot.js';
import { ChatLogger } from './chat-logger.js';
import { ChannelsService } from './channels.service.js';
import { ChannelsRepository } from './channels.repository.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  controllers: [WebhooksController],
  providers: [
    ChannelsService,
    ChannelsRepository,
    // State-pg creates its own chat_state_* tables, outside drizzle-kit.
    {
      provide: BOT,
      inject: [POOL],
      useFactory: (pool: Pool) =>
        createBot(
          createPostgresState({
            client: pool,
            logger: new ChatLogger().child('state-pg'),
          }),
        ),
    },
  ],
  exports: [ChannelsService],
})
export class ChannelsModule {}
