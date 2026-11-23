import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  incidentTypeCreateSchema,
  incidentTypeIdParamsSchema,
  incidentTypeSchema,
  incidentTypeUpdateSchema,
} from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { IncidentTypesService } from './incident-types.service.js';

class IncidentTypeDto extends createZodDto(incidentTypeSchema) {}
class IncidentTypeIdParamsDto extends createZodDto(
  incidentTypeIdParamsSchema,
) {}
class IncidentTypeCreateDto extends createZodDto(incidentTypeCreateSchema) {}
class IncidentTypeUpdateDto extends createZodDto(incidentTypeUpdateSchema) {}

@Roles(['admin'])
@Controller('admin/incident-types')
export class IncidentTypesController {
  constructor(private readonly incidentTypes: IncidentTypesService) {}

  @Get()
  @ZodResponse({ type: [IncidentTypeDto] })
  list() {
    return this.incidentTypes.list();
  }

  @Post()
  @ZodResponse({ status: 201, type: IncidentTypeDto })
  create(@Body() body: IncidentTypeCreateDto) {
    return this.incidentTypes.create(body);
  }

  @Patch(':id')
  @ZodResponse({ type: IncidentTypeDto })
  update(
    @Param() { id }: IncidentTypeIdParamsDto,
    @Body() body: IncidentTypeUpdateDto,
  ) {
    return this.incidentTypes.update(id, body);
  }
}
