import { Controller, Get } from '@nestjs/common';
import { broadcastSummarySchema } from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { BroadcastsService } from './broadcasts.service.js';

class BroadcastSummaryDto extends createZodDto(broadcastSummarySchema, {
  codec: true,
}) {}

@Roles(['responder', 'admin'])
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get(['advisories', 'advisories/recent'])
  @ZodResponse({ type: [BroadcastSummaryDto] })
  findRecentAdvisories() {
    return this.broadcasts.findRecentAdvisories();
  }
}
