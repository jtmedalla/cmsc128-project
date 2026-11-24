import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  agencyCreateSchema,
  agencyIdParamsSchema,
  agencySchema,
  agencyUpdateSchema,
} from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { AgenciesService } from './agencies.service.js';

class AgencyDto extends createZodDto(agencySchema) {}
class AgencyIdParamsDto extends createZodDto(agencyIdParamsSchema) {}
class AgencyCreateDto extends createZodDto(agencyCreateSchema) {}
class AgencyUpdateDto extends createZodDto(agencyUpdateSchema) {}

@Roles(['admin'])
@Controller('admin/agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Get()
  @ZodResponse({ type: [AgencyDto] })
  list() {
    return this.agencies.list();
  }

  @Post()
  @ZodResponse({ status: 201, type: AgencyDto })
  create(@Body() body: AgencyCreateDto) {
    return this.agencies.create(body);
  }

  /** Replaces every editable field; send the unchanged ones as they are. */
  @Put(':id')
  @ZodResponse({ type: AgencyDto })
  update(@Param() { id }: AgencyIdParamsDto, @Body() body: AgencyUpdateDto) {
    return this.agencies.update(id, body);
  }

  /** Deletes a retired, private, unused agency; 409 otherwise. */
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param() { id }: AgencyIdParamsDto) {
    await this.agencies.delete(id);
  }
}
