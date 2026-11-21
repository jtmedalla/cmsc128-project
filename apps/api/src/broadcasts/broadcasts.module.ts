import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller.js';
import { BroadcastsRepository } from './broadcasts.repository.js';
import { BroadcastsService } from './broadcasts.service.js';

@Module({
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsRepository],
})
export class BroadcastsModule {}
