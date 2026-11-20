import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { healthSchema } from '@repo/shared';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { HealthService } from './health.service.js';

class HealthDto extends createZodDto(healthSchema) {}

@Controller('health')
@AllowAnonymous()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** 503 when a check fails, so uptime checks see the outage. */
  @Get()
  @ZodResponse({ type: HealthDto })
  async check() {
    const health = await this.health.check();
    if (health.status === 'error') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
