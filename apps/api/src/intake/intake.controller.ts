import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  createdReportSchema,
  dashboardReportInputSchema,
  incidentTypeOptionSchema,
} from '@repo/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { IntakeService } from './intake.service.js';

class DashboardReportInputDto extends createZodDto(
  dashboardReportInputSchema,
) {}
class CreatedReportDto extends createZodDto(createdReportSchema) {}
class IncidentTypeOptionDto extends createZodDto(incidentTypeOptionSchema) {}

@Roles(['responder', 'admin'])
@Controller('intake')
export class IntakeController {
  constructor(private readonly intake: IntakeService) {}

  /** Logs a phone or radio report with the responder as its creator (FR38). */
  @Post('reports')
  @ZodResponse({ status: 201, type: CreatedReportDto })
  async createReport(
    @Body() input: DashboardReportInputDto,
    @Session() session: UserSession,
  ) {
    const { id } = await this.intake.createDashboardReport(
      input,
      session.user.id,
    );
    return { id };
  }

  @Get('incident-types')
  @ZodResponse({ type: [IncidentTypeOptionDto] })
  incidentTypes() {
    return this.intake.incidentTypes();
  }
}
