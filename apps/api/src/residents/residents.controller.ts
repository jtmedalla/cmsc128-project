import { Controller, Get, Param } from '@nestjs/common';
import { residentIdParamsSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { ResidentsService } from './residents.service.js';

class ResidentIdParamsDto extends createZodDto(residentIdParamsSchema) {}

@Roles(['admin', 'responder'])
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residents: ResidentsService) {}

  @Get()
  list() {
    return this.residents.list();
  }

  @Get(':id')
  get(@Param() { id }: ResidentIdParamsDto) {
    return this.residents.get(id);
  }
}
