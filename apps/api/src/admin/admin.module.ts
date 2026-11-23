import { Module } from '@nestjs/common';
import { AdminRepository } from './admin.repository.js';
import { AgenciesController } from './agencies.controller.js';
import { AgenciesRepository } from './agencies.repository.js';
import { AgenciesService } from './agencies.service.js';
import { IncidentTypesController } from './incident-types.controller.js';
import { IncidentTypesService } from './incident-types.service.js';

/** Accounts, invites, incident types and agencies (EP10). */
@Module({
  controllers: [IncidentTypesController, AgenciesController],
  providers: [
    IncidentTypesService,
    AdminRepository,
    AgenciesService,
    AgenciesRepository,
  ],
})
export class AdminModule {}
