import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  barangayIdParamsSchema,
  barangaySchema,
  barangayUpdateSchema,
} from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { BarangayService } from './barangay.service.js';

class BarangayDto extends createZodDto(barangaySchema) {}
class BarangayIdParamsDto extends createZodDto(barangayIdParamsSchema) {}
class BarangayUpdateDto extends createZodDto(barangayUpdateSchema) {}

@Controller('geo/barangays')
export class BarangayController {
  constructor(private readonly barangays: BarangayService) {}

  @Get()
  @ZodResponse({ type: [BarangayDto] })
  list() {
    return this.barangays.list();
  }

  @Patch(':id')
  @Roles(['admin'])
  @ZodResponse({ type: BarangayDto })
  update(
    @Param() { id }: BarangayIdParamsDto,
    @Body() body: BarangayUpdateDto,
  ) {
    return this.barangays.update(id, body);
  }
}
