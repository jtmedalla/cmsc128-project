import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module.js';
import { GeoModule } from '../geo/geo.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { TriageModule } from '../triage/triage.module.js';
import { ChatIntakeService } from './chat-intake.service.js';
import { IntakeController } from './intake.controller.js';
import { IntakeRepository } from './intake.repository.js';
import { IntakeService } from './intake.service.js';
import { REPORT_PARSER, UnavailableParser } from './parser.js';

@Module({
  imports: [ChannelsModule, GeoModule, RealtimeModule, TriageModule],
  controllers: [IntakeController],
  providers: [
    IntakeService,
    IntakeRepository,
    ChatIntakeService,
    { provide: REPORT_PARSER, useClass: UnavailableParser },
  ],
})
export class IntakeModule {}
