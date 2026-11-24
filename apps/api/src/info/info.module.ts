import { Module } from '@nestjs/common';
import { HotlinesController } from './hotlines.controller.js';
import { InfoRepository } from './info.repository.js';
import { InfoService } from './info.service.js';

/** Office info, hotlines and the knowledge base (EP4). */
@Module({
  controllers: [HotlinesController],
  providers: [InfoService, InfoRepository],
})
export class InfoModule {}
