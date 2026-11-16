import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { reportDetailSchema } from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { ReportsService } from './reports.service.js';

// codec: the method returns Dates; the serializer encodes them to ISO strings.
class ReportDetailDto extends createZodDto(reportDetailSchema, {
  codec: true,
}) {}

/** Read-only for now; editing arrives with #39. */
@Controller('triage/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get(':id')
  @ZodResponse({ type: ReportDetailDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const detail = await this.reports.findDetail(id);
    if (!detail) throw new NotFoundException('Report not found');
    return detail;
  }
}
