import { Global, Module } from '@nestjs/common';
import { TriageModule } from '../triage/triage.module.js';
import { ChatIntakeService } from './chat-intake.service.js';
import { IntakeService } from './intake.service.js';
import { REPORT_PARSER, UnavailableParser } from './parser.js';

@Global()
@Module({
  imports: [TriageModule],
  providers: [
    IntakeService,
    ChatIntakeService,
    { provide: REPORT_PARSER, useClass: UnavailableParser },
  ],
  exports: [IntakeService],
})
export class IntakeModule {}
