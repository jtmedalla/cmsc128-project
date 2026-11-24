import { Controller, Get } from '@nestjs/common';
import { hotlineSchema } from '@repo/shared';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { InfoService } from './info.service.js';

class HotlineDto extends createZodDto(hotlineSchema) {}

@Controller('info/hotlines')
export class HotlinesController {
  constructor(private readonly info: InfoService) {}

  /** Public agencies' numbers for `/info/hotlines` (FR46). */
  @Get()
  @AllowAnonymous()
  @ZodResponse({ type: [HotlineDto] })
  list() {
    return this.info.hotlines();
  }
}
