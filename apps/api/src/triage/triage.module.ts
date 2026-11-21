import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { TriageRepository } from './triage.repository.js';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, TriageRepository],
  exports: [ReportsService],
})
export class TriageModule {}
