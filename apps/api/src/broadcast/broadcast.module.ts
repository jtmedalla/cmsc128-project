import { Module } from '@nestjs/common';
import { BroadcastController } from './broadcast.controller.js';
import { BroadcastService } from './broadcast.service.js';

@Module({
  controllers: [BroadcastController],
  providers: [BroadcastService],
})
export class BroadcastModule {}
