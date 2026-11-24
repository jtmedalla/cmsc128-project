import { Module } from '@nestjs/common';
import { AdminRepository } from './admin.repository.js';
import { AgenciesController } from './agencies.controller.js';
import { AgenciesRepository } from './agencies.repository.js';
import { AgenciesService } from './agencies.service.js';
import { IncidentTypesController } from './incident-types.controller.js';
import { IncidentTypesService } from './incident-types.service.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

/** Accounts, invites, incident types and agencies (EP10). */
@Module({
  controllers: [UsersController, IncidentTypesController, AgenciesController],
  providers: [
    UsersService,
    UsersRepository,
    IncidentTypesService,
    AdminRepository,
    AgenciesService,
    AgenciesRepository,
  ],
})
export class AdminModule {}
