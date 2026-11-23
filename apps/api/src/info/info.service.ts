import { Injectable } from '@nestjs/common';
import type { Hotline } from '@repo/shared';
import { InfoRepository } from './info.repository.js';

@Injectable()
export class InfoService {
  constructor(private readonly repository: InfoRepository) {}

  /** Public, active agencies with a number, by name. */
  hotlines(): Promise<Hotline[]> {
    return this.repository.findHotlines();
  }
}
