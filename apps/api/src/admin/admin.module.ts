import { Module } from '@nestjs/common';
import { AdminRepository } from './admin.repository.js';
import { IncidentTypesController } from './incident-types.controller.js';
import { IncidentTypesService } from './incident-types.service.js';

/** Accounts, invites, incident types and agencies (EP10). */
@Module({
  controllers: [IncidentTypesController],
  providers: [IncidentTypesService, AdminRepository],
})
export class AdminModule {}
