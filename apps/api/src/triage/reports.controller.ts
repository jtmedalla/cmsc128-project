import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  reportDetailSchema,
  reportFeedItemSchema,
  reportIdParamsSchema,
} from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { ReportsService } from './reports.service.js';

// codec: the methods return Dates; the serializer encodes them to ISO strings.
class ReportFeedItemDto extends createZodDto(reportFeedItemSchema, {
  codec: true,
}) {}
class ReportDetailDto extends createZodDto(reportDetailSchema, {
  codec: true,
}) {}

// The global ZodValidationPipe rejects a non-UUID id with a 400.
class ReportIdParamsDto extends createZodDto(reportIdParamsSchema) {}

/** Read-only for now; editing arrives with #39. */
// TODO(PR #110 review): add @Roles(['responder', 'admin']) to both routes.
// Blocked on confirming the sitemap's roles for /incidents (the doc isn't readable yet).
@Controller('triage/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** The feed list for /dashboard/incidents. */
  @Get()
  @ZodResponse({ type: [ReportFeedItemDto] })
  findAll() {
    return this.reports.findFeed();
  }

  @Get(':id')
  @ZodResponse({ type: ReportDetailDto })
  async findOne(@Param() { id }: ReportIdParamsDto) {
    const detail = await this.reports.findDetail(id);
    if (!detail) throw new NotFoundException('Report not found');
    return detail;
  }
}
