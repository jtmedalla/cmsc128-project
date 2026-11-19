import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { reportDetailSchema, reportIdParamsSchema } from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { ReportsService } from './reports.service.js';

// codec: the method returns Dates; the serializer encodes them to ISO strings.
class ReportDetailDto extends createZodDto(reportDetailSchema, {
  codec: true,
}) {}

// The global ZodValidationPipe rejects a non-UUID id with a 400.
class ReportIdParamsDto extends createZodDto(reportIdParamsSchema) {}

/** Read-only for now; editing arrives with #39. */
@Controller('triage/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // TODO(PR #110 review): add @Roles(['responder', 'admin']). Blocked on
  // confirming the sitemap's roles for /incidents/:id (the doc isn't readable yet).
  @Get(':id')
  @ZodResponse({ type: ReportDetailDto })
  async findOne(@Param() { id }: ReportIdParamsDto) {
    const detail = await this.reports.findDetail(id);
    if (!detail) throw new NotFoundException('Report not found');
    return detail;
  }
}
