import { Controller, Get } from '@nestjs/common';
import { ResidentsService } from './residents.service.js';

@Controller('residents')
export class ResidentsController {
  constructor(private readonly residents: ResidentsService) {}

  @Get()
  list() {
    return this.residents.list();
  }
}
