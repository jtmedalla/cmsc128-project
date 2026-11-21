import { Controller, Get } from '@nestjs/common';
import { recentAdvisorySchema } from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { BroadcastService } from './broadcast.service.js';

class RecentAdvisoryDto extends createZodDto(recentAdvisorySchema, {
  codec: true,
}) {}

@Roles(['responder', 'admin'])
@Controller('broadcast')
export class BroadcastController {
  constructor(private readonly broadcasts: BroadcastService) {}

  @Get(['advisories', 'advisories/recent'])
  @ZodResponse({ type: [RecentAdvisoryDto] })
  findRecentAdvisories() {
    return this.broadcasts.findRecentAdvisories();
  }
}
