import { Controller, Get } from '@nestjs/common';
import { recentAdvisorySchema } from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { BroadcastsService } from './broadcasts.service.js';

class RecentAdvisoryDto extends createZodDto(recentAdvisorySchema, {
  codec: true,
}) {}

@Roles(['responder', 'admin'])
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get(['advisories', 'advisories/recent'])
  @ZodResponse({ type: [RecentAdvisoryDto] })
  findRecentAdvisories() {
    return this.broadcasts.findRecentAdvisories();
  }
}
